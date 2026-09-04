# Pathology Case View — Histology Bench Workflow to Sign-out

**FRS · Version 2.0 · 2026-09-04**
**Supersedes:** `designs/pathology/pathology-case-view.md` (v1.0, December 2025)
**Shell:** conforms to `case-view-shell.md` v1.0 — see Shell Conformance
**Module:** Pathology → Case Detail View
**Route:** `/PathologyCaseView/:pathologySampleId` *(existing live route)*
**SideNav:** `Pathology → Dashboard → Case View`
**Breadcrumb:** `Home / Pathology / Dashboard / Case [LabNumber]`
**Epic:** `OGC-264`
**Role required:** existing `Histopathology` module role bundle

---

## Lab Context

*A developer-onboarding narrative for someone who has never worked in a clinical laboratory. Read this first. It stands on its own — no cross-references to other sections of this spec.*

### Current State

A surgeon removes a piece of tissue — a core needle biopsy of a liver lesion, a resected tumour, a skin punch — puts it in a pot of formalin (a fixative that stops the tissue decaying), and sends it to the histopathology laboratory. What arrives is a wet lump of tissue. What has to come out the other end is a typed diagnosis a clinician can treat from. Between those two things is about two days of physical craft work — grossing on day one, the processor running overnight, then embedding, microtomy and staining through the following morning — and it is the same sequence in every histopathology lab in the world. End to end, the published standard is 5–7 days for a routine biopsy and 7–10 for a complex case, measured from accession (NCI Surgical Pathology Reporting standard).

A **pathologist or senior technician grosses** the specimen: describes it out loud (size, colour, how far the tumour appears to extend), then dissects it and places selected pieces into small perforated plastic **cassettes**, each about the size of a postage stamp. A liver core might make one cassette; a resected colon might make thirty. The cassettes go into a **tissue processor**, a machine that runs overnight — typically eight to fourteen hours — soaking the tissue through graded alcohols and solvents and finally hot paraffin wax, so it becomes firm enough to slice. This is a batch: one processor run holds cassettes from many different patients. Next morning a technician **embeds** each cassette: the wax-infiltrated tissue is oriented in a mould, topped with molten wax and chilled into a solid **block**. The block is the same physical object the cassette was — the cassette becomes its base. A technician then takes each block to a **microtome**, a precision blade that shaves ribbons of tissue two to five microns thick, and floats those sections onto glass **slides**. The slides are **stained** — routinely with haematoxylin and eosin, which turns nuclei blue and cytoplasm pink, plus any special stains the case needs — then coverslipped, checked, and delivered to the pathologist, who reads them down a microscope and writes the report.

OpenELIS already models a good deal of this. `PathologySample` ships today with a `PathologyStatus` enum of eight values — `GROSSING`, `CUTTING`, `PROCESSING`, `SLICING`, `STAINING`, `READY_PATHOLOGIST`, `ADDITIONAL_REQUEST`, `COMPLETED` — and the Pathology Dashboard already filters its worklist on them. `pathology_block` and `pathology_slide` tables exist. `pathology_request` exists, for the requests a pathologist sends back to the bench. `grossExam` and `microscopyExam` are columns on the case. The screen a user actually sees, though, is `PathologyCaseView.jsx`, and the December 2025 redesign that was supposed to replace it ignored nearly all of that: it invented a `PathologistRequest` entity alongside the shipping `PathologyRequest`, declared the already-shipping `PathologyTechnique` as new, and drove its section locking off a fresh boolean instead of the status enum.

### Pain

The lab cannot tell you where a case is, and cannot prove what happened to the tissue.

Three concrete examples. First, the bench stages between grossing and staining are invisible. The December 2025 design collapsed processing, embedding and microtomy into two static tables of blocks and slides, so when a clinician rings to ask why a biopsy taken on Monday still has no report, nobody can say whether it is sitting in a processor, waiting to be embedded, or stuck behind a microtome with a blunt blade. The status enum that would answer this already exists in the database and no screen reads it.

Second, nothing links a slide to the block it was cut from. `pathology_slide` has `id`, `slideNumber`, an image blob, a file type and a free-text `location` — and no block reference at all. Both blocks and slides hang directly off the case. So the question "which block did this slide come from" has no answer in the schema, which means the question "we are one block short, which one" has no answer either. `ISO 15189:2022` clause **7.2.6.1(g)** requires "ensuring that all portions of the sample are unequivocally traceable to the original sample." Today that is not satisfiable for a histopathology case.

Third, no step records who did it. The design carried a single case-level "Assigned Technician", but grossing, embedding, microtomy and staining are routinely four different people across two shifts, and `ISO 15189:2022` **7.3.1(d)** requires that "the identity of persons performing significant activities in examination processes be recorded." When a slide comes out mislabelled — and published rates put mislabelling at about **1.1 per 1,000 cases**, with **22% of it at block labelling and 30% at tissue cutting** (Nakhleh et al., CAP Q-Probes across 136 institutions, *Arch Pathol Lab Med* 2011;135(8):969) — there is no record of whose bench it passed through, and no scan-verification step at the one transition where over half of all mislabelling happens.

There is a fourth, quieter cost. Because blocks and slides carry no barcode and no designation beyond an integer, labels cannot be reprinted faithfully, and the alphanumeric designations that pathologists actually use — block `A1` linked to the first paragraph of the gross description — cannot be represented at all.

### What Changes

After this work ships:

- The case moves through named bench stages the whole lab can see, driven by the `PathologyStatus` enum the module already ships, reworked to match the real sequence: accessioned, grossing, optional decalcification, processing, embedding, microtomy, staining, coverslipping, ready for pathologist, under review, completed. The screen's sections, its progress rail, its action bar and the dashboard worklist filter all read that one value. Deployments that do not track a stage separately switch it off in configuration rather than having it modelled away.
- A cassette created at grossing and the block it becomes at embedding are **one row with a continuous identity and one barcode**, because they are one physical object. Each slide records the block it was cut from. Every block and slide carries a configurable designation and a barcode, and every count on the screen is derived by counting those rows — never typed. "Three of four blocks embedded" becomes a computed statement that names the fourth.
- At the microtome, the technician scans the block before sectioning and the printed slide label is verified against it. This is the single highest-value control on the screen: barcode interventions in published work cut slide misidentification by **92%** at one centre (*Arch Pathol Lab Med* 2013;137:1798) and took slide-printing errors from 27.4 to 0.4 per month at another (Heher et al., *Am J Clin Pathol* 2016;146(5):554).
- Every stage entry and exit records the operator and the timestamp, captured from the session and the server clock rather than typed into a field.
- A pathologist can request more work from the bench — another block, deeper sections, a special stain — as an inline row on the case rather than a modal, and can request a **second pathologist's opinion**, whose agree / disagree / modified outcome is stored as a queryable field, because the CAP/ADASP guidance on interpretive error reduction requires labs to monitor the results of their case reviews continuously, not merely to hold reviews.
- A malignant conclusion emits a critical-result event on sign-out, on the same path as cytology.

A backend developer who has never set foot in a histopathology lab should now know: tissue becomes cassettes, cassettes become blocks, blocks become slides, slides get stained and read; each of those is an identified object with a parent; and the case's stage says which of those steps it is in.

---

## Overview

The Pathology Case View is the case-detail screen used by histopathology technicians and pathologists to carry a tissue case from receipt to a signed-out report. This redesign replaces the current free-form screen with a stage-driven workflow that grounds every UI element in the existing `pathology_sample` / `pathology_block` / `pathology_slide` / `pathology_request` / `pathology_conclusion` schema, makes every block and slide an individually identified and traceable object, and hooks malignant conclusions into the global Critical Result Acknowledgment system.

### Navigation & URL

| Item | Value |
|------|-------|
| URL | `/PathologyCaseView/:pathologySampleId` — unchanged from the current route. `PathologyDashboard.openCaseView` navigates to `"/PathologyCaseView/" + id`, and `PathologyDisplayService.convertToCaseDisplayItem(Integer pathologySampleId)` names the parameter. `/PathologyCaseView` is registered in `system_module_url` for the `Pathology` module (`liquibase/2.8.x.x/pathology.xml`). |
| SideNav | `Pathology → Dashboard → Case View` — opens from the Pathology Dashboard worklists. Submenus for pathology, cytology and IHC were re-added after `OGC-17` removed them. |
| Breadcrumb | `Home / Pathology / Dashboard / Case [LabNumber]` |
| Page title | `Pathology Case — [LabNumber]` |

### Scope

**In scope (this FRS):** case-detail screen redesign on the shared Case View Shell; rework of the `PathologyStatus` enum to the canonical bench sequence with per-deployment stage enablement; cassette-to-block continuous identity and block-to-slide parentage; configurable block and slide designation and barcode schemes; derived reconciliation at every handoff; scan-verified slide labelling at the microtome; per-stage operator and timestamp capture; pathologist bench requests as inline rows; second-opinion consultation with a queryable outcome; pathologist findings, coded conclusion and IHC referral; report list and generation; critical-result hook for malignant conclusions.

**Out of scope (parked, or owned elsewhere):**

- **Pathology Dashboard** (`/PathologyDashboard`) — separate existing screen. This FRS changes the *values* its stage filter offers and says so, but does not redesign it. `OGC-15` and `OGC-16` already touched it.
- **Label preset administration and print orchestration** — shared `barcodeWorkflow`; `OGC-284` schedules Pathology Case View as M8 "Pathology family rollout via shared orchestration", and the live component already imports `PostSavePrintDialog`. This FRS says what the label subject is, not what the print dialog looks like.
- **Report delivery, queueing and print presets** — `OGC-1031`, anchor `OGC-431`.
- **Text macro expansion** — cross-cutting Macro Library, `OGC-788`. This FRS names the fields that consume it.
- **Tissue processor run management** — the processor run is a batch spanning many cases, with instrument, program and reagent-lot identity. This FRS records *which run a cassette was in*; the run itself is a declared dependency.
- **Whole-slide imaging** — tile serving, multi-scan, preferred-scan selection, scanner metadata and annotation. One attached image per slide only, which `pathology_slide` already supports.
- **IHC scoring** — `OGC-265`. This FRS specifies the referral out; the IHC FRS specifies the receipt.
- **Synoptic cancer-protocol reporting** — CAP electronic Cancer Protocols require discrete paired element/response fields. The conclusion model here does not foreclose it, but structured synoptic capture is a separate FRS.
- **Autopsy and frozen-section workflows** — different turnaround and reporting; separate screens.

---

## User Stories

1. **As a histopathology technician**, I want the case to show which bench stage it is in and what the next handoff is, so that I can pick up work without asking who has the tray.
2. **As a histopathology technician**, I want to scan the block at the microtome and have the slide label verified against it before I cut, so that I do not mount a section on another patient's slide.
3. **As a pathologist**, I want to request another block, deeper sections or a special stain from the case screen and see the request's status change as the bench works it, so that I am not chasing the request by phone.
4. **As a pathologist**, I want to ask a colleague for a second opinion on a difficult case and have their agreement or disagreement recorded, so that our departmental review results can be monitored as our quality programme requires.
5. **As a lab manager**, I want every block and slide to be an identified row with a parent and a barcode rather than a typed count, so that when tissue goes missing the system can tell me which piece and where it was last seen.

---

## Layout

The shell's Workbench layout with the progress rail **on**, because this screen has more than five gated sections. Work sections are Carbon `Accordion` items in bench order; the rail carries per-stage completion and pending-request badges; the Case Summary panel holds derived object counts and the headline conclusion; the action bar's primary action changes with the case status and the current user's role.

```
 Home / Pathology / Dashboard / Case 24TST000010
 Pathology Case — 24TST000010
├──────────────── PatientHeader (existing common component) ──────────────────┤
│ VAISHA, LAMALI │ DOB 1985-06-15 (40 y) │ M │ UHID … │   Stage: MICROTOMY    │
│ ╭ Prior anatomic-pathology results ───────────────────────────────────────╮ │
│ │ 24TST00009  2024-01-22  Liver core   C22.0 Hepatocellular carcinoma     │ │
│ │ 23CYT00114  2023-01-27  Cervical     NILM                               │ │
│ ╰──────────────────────────────────────── [View full patient history] ────╯ │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌ RAIL ─────────┐ ┌ WORK SECTIONS ──────────────┐ ╭ CASE SUMMARY ────────╮ │
│ │ ✓ 1 Case info │ │ ▸ 1. Case Information       │ │ Stage:    Microtomy  │ │
│ │ ✓ 2 Grossing  │ │ ▾ 2. Grossing      [4 cass] │ │ Cassettes: 4         │ │
│ │ – 3 Decalc    │ │ ▸ 3. Decalcification  n/a   │ │ Blocks:    4 of 4    │ │
│ │ ✓ 4 Processing│ │ ▾ 4. Processing     [Run 12]│ │ Slides:    6         │ │
│ │ ✓ 5 Embedding │ │ ▾ 5. Embedding     [4 of 4] │ │ Stained:   4 of 6    │ │
│ │ ● 6 Microtomy │ │ ▾ 6. Microtomy     [6 sl.]  │ │ Requests:  ⚠ 2 open  │ │
│ │   7 Staining  │ │ ▸ 7. Staining   🔒 awaiting │ │ Conclusion: —        │ │
│ │   8 Coverslip │ │ ▸ 8. Coverslipping 🔒       │ │ Report:     none     │ │
│ │ 🔒 9 Review ⚠2│ │ ▸ 9. Pathologist Review 🔒  │ ╰──────────────────────╯ │
│ │ 🔒 10 Findings│ │ ▸ 10. Findings & Conclusion │                          │
│ │   11 Reports  │ │ ▸ 11. Reports               │                          │
│ └───────────────┘ └─────────────────────────────┘                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Stage: MICROTOMY  ⚠ Unsaved  [Discard changes] [Save draft] [Send to Stain] │
└─────────────────────────────────────────────────────────────────────────────┘
```

The tab strip in the client's requested design is intentionally not used. Tabs render one stage at a time, and the pathologist reading the case at sign-out needs the gross description and the microscopic description legible together — the whole point of the reading step is correlating them. Accordions give the same stage-by-stage guidance with completed stages collapsed, and let a technician correct an earlier stage without losing their place. The numeric stage counters in that design are also not used; see FR-9.

---

## Shell Conformance

| Element | Status | Variation / note |
|---|---|---|
| S-1 PatientHeader | conforms | — |
| S-2 Prior related results | conforms | cross-bench: shows prior pathology, IHC and cytology cases for the patient |
| S-3 Accordion sections | conforms | eleven sections, bench order |
| S-4 Section state model | conforms | state derived from `PathologyStatus` + role bundle; no stored completion flag |
| S-5 Progress rail | conforms — **on** | eight gated sections, above the five-section threshold |
| S-6 Case Summary panel | conforms | every count derived per S-10.3 |
| S-7 Action bar | conforms | primary action is the stage's forward transition, or Sign out for the pathologist |
| S-8 Status transitions | conforms with variation | reworks the existing `PathologyStatus` enum rather than consuming it unchanged; see FR-2 and Dependencies |
| S-9 Critical-result hook | conforms | introduced; malignant coded conclusion is the trigger — FR-14 |
| S-10 Identified objects | conforms | blocks (as cassette-then-block) and slides; parentage added — see Data Model |

---

## Functional Requirements

### FR-1 · Case Information section (display-only, collapsed by default)

Backed by the existing `Sample`, `ProgramSample` and `PathologySample` entities. No editing.

| Field | Source |
|-------|--------|
| Lab number | `sample.accession_number` |
| Request date | `sample.entered_date` |
| Specimen arrival date | `sample.received_date` — distinct from request date; the grossing clock starts here |
| Specimen / specimen type | `sample_item.type_of_sample_id` joined to `type_of_sample` |
| Referring provider | `sample_requester` joined to `provider` |
| Referring facility | `sample_requester` joined to `organization` |
| Clinical history, procedure performed, provisional clinical diagnosis, previous surgery or treatment | `questionnaire_response_uuid` rendered via the existing `<QuestionnaireResponse>` component |
| Assigned technician / pathologist | `pathology_sample.technician` / `.pathologist` (existing `SystemUser` FKs) |

If a field is unavailable, render the row with `—` and a small "not recorded" hint. **No invented fields.** The December 2025 design listed `Nature/Site of Specimen`, `Unit Number`, `Private Reference Number` and `RT Number` as sourced from "Order" without naming an order field for any of them; each is either an existing questionnaire response or it is not in scope. `RT Number` in particular appears in the client's design and has no known OpenELIS counterpart — it is **not** specified here and is listed in Dependencies as an open question for the site.

### FR-2 · Stage model and transitions

The screen drives the existing `PathologyStatus` enum on `PathologySample`, reworked to the canonical bench sequence. This is the FRS's largest single change and it reaches the backend and the dashboard.

**FR-2.1 · The reworked enum.**

| # | Value | Display | Status |
|---|---|---|---|
| 1 | `ACCESSIONED` | Accessioned | **new** — received and triaged, awaiting grossing |
| 2 | `GROSSING` | Grossing | existing; **absorbs `CUTTING`** (cut-up is part of grossing, not a separate bench) |
| 3 | `DECALCIFICATION` | Decalcification | **new** — conditional; entered only when flagged at grossing |
| 4 | `PROCESSING` | Processing | existing; run-based |
| 5 | `EMBEDDING` | Embedding | **new** — the missing handoff where a cassette becomes a block |
| 6 | `MICROTOMY` | Microtomy | existing `SLICING` ("Slicing for Slides"), **renamed** to standard terminology |
| 7 | `STAINING` | Staining | existing |
| 8 | `COVERSLIPPING` | Coverslipping & QC | **new** — batch; may be disabled per deployment |
| 9 | `READY_PATHOLOGIST` | Ready for Pathologist | existing |
| 10 | `UNDER_REVIEW` | Under Pathologist Review | **new** — separates the queue from a case in hand, so the dashboard's "Awaiting Pathology Review" tile counts only what nobody has started |
| 11 | `COMPLETED` | Completed | existing |

**Retired:** `CUTTING` (→ `GROSSING`), `SLICING` (→ `MICROTOMY`), and `ADDITIONAL_REQUEST`, which is not a stage but a parking state — it becomes a **derived flag** from `pathology_request` rows with status `OPENED`, which the `requests` collection on `PathologySample` already supports. A case with open requests shows the flag at whatever stage it is genuinely in, instead of losing its stage to represent the fact that something is outstanding.

**FR-2.2 · Migration.** A single Liquibase changeset maps existing rows: `CUTTING` → `GROSSING`; `SLICING` → `MICROTOMY`; `ADDITIONAL_REQUEST` → `READY_PATHOLOGIST` (the state it is reached from; the open-request flag then derives from the request rows). `GROSSING`, `PROCESSING`, `STAINING`, `READY_PATHOLOGIST` and `COMPLETED` are unchanged. The five new values are reachable only going forward; no historical row is assigned one.

**FR-2.3 · Per-deployment stage enablement.** Per Constitution Principle I, each stage other than the mandatory spine is enabled or disabled per deployment through the existing common-properties pattern, as `pathology.stage.<value>.enabled`. Mandatory and non-disableable: `ACCESSIONED`, `GROSSING`, `READY_PATHOLOGIST`, `COMPLETED`. A disabled stage is skipped by the forward transition and rendered as `n/a` in the rail — never hidden, per S-3.3. `DECALCIFICATION` is additionally **conditional**: enabled labs still only enter it when grossing flags the specimen as requiring decalcification.

**FR-2.4 · Transitions.** Forward through the enabled sequence only, one stage at a time, via the action bar's primary action, whose label names the next stage ("Send for processing", "Send for embedding", "Send to microtomy", "Send for staining", "Send to pathologist"). Every transition writes a `pathology_stage_event` row capturing the stage, the actor from the session and the server timestamp — **never a typed name or a typed date**, per S-8.2 and `ISO 15189:2022` 7.3.1(d). The client's design puts Personnel and Date filled as editable inputs on every stage; that is not an attribution record and is not adopted.

**FR-2.5 · Backward movement** is by explicit **return to previous stage** with a mandatory reason, available to the `Histopathology` bundle, audited, and recorded as a further `pathology_stage_event`. It exists because trays genuinely come back — a block that will not section, an unsatisfactory stain — and a forward-only model makes technicians lie to the system.

**FR-2.6** The enum's values, display strings and order are the single source for the Pathology Dashboard stage filter and for `DisplayListService.ListType.PATHOLOGY_STATUS`. Changing them changes that screen; see Dependencies.

### FR-3 · Grossing section

Backed by `pathology_sample.grossExam` (existing column) and the cassette rows created here.

**FR-3.1** A macroscopic description field (`grossExam`), rendered as a Carbon `TextArea`, consuming macro expansion from `OGC-788`. **FR-3.2** A `Checkbox` marking the specimen as requiring decalcification, which is what makes `DECALCIFICATION` reachable (see FR-2.3). **FR-3.3** The cassettes cut from this specimen are created here as identified rows — see FR-9 — each with its designation, barcode and tissue type. Their labels print through the shared `barcodeWorkflow` flow. **FR-3.4** The section is complete when the description is non-empty after trim and at least one cassette exists.

### FR-4 · Decalcification section (conditional)

**FR-4.1** Visible only when enabled per FR-2.3, and enterable only when FR-3.2 flagged the specimen. When enabled but not flagged, the section renders as `n/a` with the hint "Not required for this specimen". **FR-4.2** Records the agent used (dictionary-backed), start and end timestamps, and the operator — all as a `pathology_stage_event` with its notes, not as new columns. **FR-4.3** Cassettes are not re-identified; they carry through.

### FR-5 · Processing section

**FR-5.1** Records the processor run each cassette went into: instrument, program and run start and end. The run is a batch spanning many cases and is **not owned by this screen** — this section records the run reference against the case's cassettes and displays it read-only. Until run management exists (see Dependencies), the run reference is captured as free text on the stage event and the section states that plainly rather than implying a run registry exists. **FR-5.2** All of a case's cassettes normally move together; the section supports advancing a subset, in which case the case stays at `PROCESSING` until the last cassette is out, and the Case Summary shows the split.

### FR-6 · Embedding section

**FR-6.1** This is where a cassette becomes a block. Per the Data Model, that is **one row transitioning its own state**, not a new object: same identity, same barcode, same designation. `cassette_state` moves `CASSETTE` → `BLOCK`. **FR-6.2** The section lists the case's cassettes with a per-row embed action, capturing the operator and timestamp on the stage event. **FR-6.3** **Reconciliation is derived and names the gap.** The header badge reads "3 of 4 embedded" as a computed count over rows, and the section shows explicitly which cassette is outstanding — never two numbers a technician typed. This is the requirement the client's "Number of Blocks: 4 / Number of Blocks Embedded: 3" pattern cannot meet: a count cannot name the missing block, and `ISO 15189:2022` 7.2.6.1(g) requires every portion be traceable to the original sample. **FR-6.4** Storage location for each block reuses the shared sample Storage model and `LocationPickerModal` per `D-035` — a typeahead over storage locations with a browse affordance, not the free-text `location` string the table carries today.

### FR-7 · Microtomy section

Backed by `pathology_slide` rows, each now carrying the block it was cut from.

**FR-7.1** The section presents the case's blocks, each expandable to the slides cut from it — the nested block-then-slides shape, which is how the bench actually works and which the client's design gets right. Slides are added as inline rows under their block, never in a modal. **FR-7.2** Each slide row carries its designation, barcode, level, intended stain (dictionary-backed typeahead, per `D-007`), and its own label action.

**FR-7.3 · Scan-verified labelling — the control this section exists for.** Before sectioning, the technician scans the block; the system prints the slide label for that block and requires the printed label be scanned back to confirm the match before the slide row is committed. `label_verified_at` and `label_verified_by` are recorded. This ordering matters: the label is produced and verified **at the microtome, before the section is cut**, not after coverslipping. Published evidence concentrates mislabelling at exactly this transition — 22% at block labelling and 30% at tissue cutting, 52% combined (Nakhleh et al., *Arch Pathol Lab Med* 2011;135(8):969) — and barcode verification here reduced slide misidentification by 92% at Henry Ford (*Arch Pathol Lab Med* 2013;137:1798) and slide-printing errors from 27.4 to 0.4 per month (Heher et al., *Am J Clin Pathol* 2016;146(5):554).

**FR-7.4** A mismatch blocks the commit, shows a Carbon `InlineNotification` kind `error` naming both scanned identifiers, and is audited. **FR-7.5** Where a deployment has no scanner, verification degrades to an explicit two-field confirmation with the same audit record, behind `pathology.microtomy.scanVerificationRequired`. It degrades; it is not silently skipped.

### FR-8 · Staining and Coverslipping sections

**FR-8.1** The staining section lists the case's slides with their intended stain, actual stain, status and operator. Status values reuse the existing dictionary-backed pattern; a slide's stain is a dictionary entry, selected through a filterable `ComboBox` because the stain catalogue grows (`D-007`) — not the static 14-item native `select` the December 2025 mockup used in two places. **FR-8.2** Slides may be advanced individually or as a multi-select batch; the batch action operates on selected rows and its confirmation names the selected slides, not a count (per the labels-not-counts convention). **FR-8.3** An unsatisfactory stain is recorded as such and returns the slide for a recut via FR-2.5, which is the honest path for what the bench does anyway. **FR-8.4** The coverslipping section, when enabled, records the batch and a QC pass or fail per slide; a failed slide returns for recut. When the stage is disabled it renders `n/a`.

### FR-9 · Object identity, designation and barcode

This requirement is the spine of the whole spec: everything the lab must be able to prove depends on blocks and slides being identified rows rather than numbers.

**FR-9.1 · Cassette and block are one object.** A cassette created at grossing and the block it becomes at embedding are a single `pathology_block` row whose `cassette_state` moves `CASSETTE` → `BLOCK`. They share one identity, one designation and one barcode for the object's whole life, because they are one physical thing — the cassette becomes the block's base. The barcode is therefore assigned and printed **at grossing**, where the label is physically applied, not at embedding.

**FR-9.2 · Slides record their parent block.** Every `pathology_slide` row references the `pathology_block` it was cut from. This link does not exist today — see Data Model — and without it `ISO 15189:2022` 7.2.6.1(g) traceability is unsatisfiable.

**FR-9.3 · The designation scheme is configurable per deployment.** The CAP/NSH guideline *Uniform Labeling of Blocks and Slides in Surgical Pathology* (Nakhleh et al., *Arch Pathol Lab Med* 2015; PMID 25897820) **explicitly declined to prescribe a universal convention**, finding "insufficient evidence in the published literature to support a specific convention for labeling," and instead requires each institution to establish an internal naming convention, articulate it in a policy, and apply it uniformly. It likewise made **no recommendation** on standardised stain abbreviations. So this FRS does not pick one. It enforces the **hierarchy** — case → part → block → slide (level) — and the **required content**, and leaves the rendering to configuration.

| Element | Configurable | Enforced regardless |
|---|---|---|
| Part designation | alphabetic (`A`, `B`) or numeric | unique within the case, linked to the gross description |
| Block designation | e.g. `A1`, `A-1`, `1` | unique within the case; alphanumeric string, not an integer |
| Slide / level designation | e.g. `S001`, `1`, `L2` | unique within the block; sequential in cutting order |
| Separator and barcode composition | e.g. `24TST000010.A1.S001` | resolvable to exactly one object; stored, not only computed |
| Barcode symbology | 1D or 2D (2D preferred — higher density, omnidirectional) | one canonical barcode per object |

**FR-9.4 · Required label content**, per the same guideline: two unambiguous identifiers of which one is the accession number; on a block, the **accession number most prominent**; on a slide, accession + part + block + level, then the procedure or stain code. Which fields print is label-preset configuration owned by `OGC-285`, not this FRS.

**FR-9.5 · Barcodes are stored, not only derived.** A resolved barcode string is persisted on each object at creation so that a reprint years later reproduces the original label even if the deployment's scheme has since changed. *Note: the guideline above is listed by CAP as inactive as of March 2021; its status should be re-verified before release, though its central finding — that no universal convention exists — is not in dispute.*

**FR-9.6 · Counts are always derived.** No count of cassettes, blocks or slides is stored or entered anywhere in this screen. Every count in a section badge or in the Case Summary is computed over rows, and every reconciliation names the outstanding object.

### FR-10 · Pathologist bench requests

Backed by the existing `pathology_request` table and its `RequestStatus` enum (`OPENED`, `COMPLETED`, `CANCELLED`), extended per the Data Model. The December 2025 design invented a `PathologistRequest` entity alongside this shipping one.

**FR-10.1** A requests table lives in the Pathologist Review section, listing every request on the case: raised date, requester, kind, target, instruction, priority, status. **FR-10.2** A request is created as an **inline "New request" row at the top of that table**, not in a modal — per `D-005` and `D-011`. From a block or slide row elsewhere on the screen, the row action pre-fills the kind and target and scrolls to it.

**FR-10.3** The kind is `BLOCK` (more tissue from the specimen), `SLIDE` (further sections from a block — deeper levels, thinner sections), or `STAIN` (a specific stain on an existing slide). **FR-10.4** The target picker is a typeahead **filtered by the chosen kind** — blocks for a slide request, slides for a stain request — never one flat list of every object on the case. The December 2025 modal offered every slide and every block in a single native `select`, unfiltered by kind, so a block request offered slides as targets; with bulk-add of up to fifty slides that control is unusable at real case size (`D-007`).

**FR-10.5** Stain type appears **only** for a `STAIN` request. **FR-10.6** The instruction field is required and free-text, because the instruction is the point — "deeper sections", "thinner at 3µm rather than 5µm" — and is stored in the existing `value` column. **FR-10.7** Priority is `NORMAL`, `URGENT` or `STAT`.

**FR-10.8** Status moves `OPENED` → `COMPLETED`, with `CANCELLED` available and a reason required. Reverting a completed request to `OPENED` is permitted for miskeys and is audited. **FR-10.9** A request may record the object that fulfilled it, so a deeper-level slide is traceable to the request that asked for it.

**FR-10.10** Open requests raise a badge on the rail's Pathologist Review item and a row in the Case Summary; both **name what is outstanding** on hover and in the accessible label, per S-5.2. **FR-10.11** Sending a case to the pathologist with open requests is permitted after a confirmation listing them, and the override is audited — the bench sometimes cannot fulfil a request and the pathologist needs to know that rather than have the case stuck. **FR-10.12** The requester is the pathologist and the fulfiller is the bench; UI copy reflects that. The December 2025 mockup's tooltips read "Request additional block from pathologist", reversing it.

### FR-11 · Second-opinion consultation

Backed by a new `pathology_consultation` table (see Data Model). This concept exists in neither the December 2025 pathology design nor cytology v2, and appears in the client's design as "Request additional pathologist".

**FR-11.1** From the Pathologist Review section, a pathologist may request a second opinion, selecting a colleague (typeahead over users holding the `Histopathology` bundle), a reason (dictionary-backed), and whether the request is pre-treatment.

**FR-11.2 · The outcome is a queryable field**, not a comment: `AGREE`, `DISAGREE` or `MODIFIED`, with an optional free-text note. This is a requirement, not a nicety. The CAP/ADASP guideline *Interpretive Diagnostic Error Reduction in Surgical Pathology and Cytology* (Nakhleh et al., *Arch Pathol Lab Med* 2015; doi:10.5858/arpa.2014-0511-SA) requires laboratories to establish a documented case-review procedure, perform reviews **before treatment begins**, document the procedure, and **monitor and document the results continuously**, acting when agreement is poor. Continuous monitoring of results is only possible if the outcome is a field.

**FR-11.3 · Review triggers are configurable rules, not a hard-coded diagnosis list.** The same guideline deliberately leaves selection criteria to the institution — review may be scoped by diagnosis, organ system, random sampling, or conference. The screen therefore supports a configurable rule that *suggests* a second opinion, and never blocks sign-out on one.

**FR-11.4** A consultation in `REQUESTED` state shows on the rail and in the Case Summary. **FR-11.5** The consulted pathologist's identity, the request and response timestamps, and the pre-treatment flag are all recorded. **FR-11.6** Consultations appear in the final report per the lab's policy on documenting intra-departmental consultation.

### FR-12 · Pathologist Review and Findings sections

**FR-12.1** Both sections are disabled until the case reaches `READY_PATHOLOGIST`, with the `lockedHint` naming the stage being waited on. Opening the case at `READY_PATHOLOGIST` as a pathologist transitions it to `UNDER_REVIEW`.

**FR-12.2** Review holds the pathologist assignment (typeahead over users holding the bundle — not the three hardcoded names the December 2025 mockup shipped), the slide list received, review notes, the requests table (FR-10) and the consultation panel (FR-11).

**FR-12.3** Findings holds the **macroscopic** and **microscopic** descriptions, backed by the **existing `pathology_sample.grossExam` and `microscopyExam` columns**. Both are Carbon `TextArea` fields consuming macro expansion from `OGC-788`. The gross description entered at grossing (FR-3) and the pathologist's macroscopic findings are the same column and the same text: the pathologist edits and completes what the bench began, with the change history in Envers, rather than the two coexisting as separate fields. The December 2025 design had `Gross Description` in Grossing *and* `Gross Exam Findings` in Findings, and named the microscopic field three different ways across its own FRS and mockup.

**FR-12.4** Techniques used are recorded via the **existing `PathologyTechnique`** entity, which the December 2025 FRS declared as a new entity. Selection is a filterable multi-select rendering the **selected techniques as removable labelled chips**, never a bare count.

**FR-12.5** Both descriptions must be non-empty after trim before sign-out.

### FR-13 · Coded conclusion and IHC referral

Backed by the existing `pathology_conclusion` table, whose shape is `value` plus `type` ∈ `DICTIONARY` | `TEXT` — the same dictionary-or-text pattern cytology uses for specimen adequacy — with `conclusions` already a collection on `PathologySample`.

**FR-13.1** A case carries one or more conclusions. A **coded** conclusion is a row with `type = DICTIONARY` referencing a dictionary entry in the pathology diagnosis category; a **narrative** conclusion is a row with `type = TEXT`. Several coded conclusions are several rows. **No new table is required**, and the December 2025 design's 24 hardcoded diagnoses each carrying ICD-10 and SNOMED, with no entity behind them anywhere in its data model, is replaced by dictionary content.

**FR-13.2** The coded-conclusion picker is a filterable typeahead searchable by name or code (`D-007`), rendering selections as removable labelled chips. Adding a diagnosis absent from the dictionary requires the existing dictionary-entry permission; a user without it sees the option disabled with the reason, rather than the December 2025 mockup's behaviour of writing straight to the option list with no check at all.

**FR-13.3** Which code system the dictionary carries — ICD-10, ICD-11, SNOMED CT — is deployment configuration, not a design choice. CLIA `42 CFR 493.1273(e)` requires "acceptable terminology of a recognized system of disease nomenclature" without mandating a specific vocabulary. The coded conclusion is what surfaces in the prior-results panel (S-2) and in the report.

**FR-13.4 · IHC referral.** A `Checkbox` refers the case to Immunohistochemistry. Selecting it, and saving, creates the `ImmunohistochemistrySample` whose existing `pathology_sample_id` `@OneToOne` points back at this case, and sets its existing `reffered` flag (spelled that way in the schema; preserved deliberately). **No new column is added on the pathology side** — the relationship already exists and is owned by the IHC entity. This is the pathology end of the seam; the IHC end is specified in the IHC FRS (`OGC-265`). The referral does not block sign-out of the histopathology report. This field was specified in the December 2025 FRS and absent from its mockup.

### FR-14 · Critical-result acknowledgment hook

**FR-14.1** A coded conclusion whose dictionary entry is marked malignant, or a narrative conclusion the pathologist explicitly flags as critical, marks the case as containing a critical result. Which dictionary entries are malignant is dictionary content, not hardcoded logic.

**FR-14.2** A persistent Carbon `InlineNotification` kind `warning` with `role="alert"` appears at the top of the Findings section stating that the finding will require acknowledgment by the ordering clinician and will be flagged in the Alerts Dashboard on sign-out.

**FR-14.3** On sign-out, the case emits a `CriticalResultEvent`, per S-9. The consumer is built in the Critical Result Acknowledgment work. `criticalResultAcknowledgmentEnabled` gates the consumer only; the event is emitted regardless and **sign-out is never blocked** by the feature's absence.

### FR-15 · Reports section

**FR-15.1** A list of the case's `pathology_report` rows: version, generated date, generated by, type (draft or final), and voided state. Versions accumulate; nothing is overwritten.

**FR-15.2 · One click opens the report in a new browser tab.** That is the whole row interaction. There are no per-row View, Download, Print or Email buttons: the browser's own PDF viewer in that tab already provides download, print and share, and duplicating them as application buttons adds four controls that do less well what the tab does natively. This matches the shipped behaviour users already have.

**FR-15.3** `Generate report` likewise **opens the generated report in a new tab**, as report generation already does elsewhere in the app, and adds the new version to the list.

**FR-15.4** Generation is gated on the actual precondition — both descriptions non-empty and at least one conclusion present — and its disabled `title` states that same condition. It is **not** gated on case status. The December 2025 mockup gated it on `caseData.status`, seeded that status to a value that never satisfied the test, and displayed a tooltip naming a different condition entirely, so the button was permanently dead.

**FR-15.5** Re-generate creates a new version after a confirmation; the prior version is retained and marked superseded. **FR-15.6** A report may also be **uploaded** rather than generated, for labs that produce the narrative outside OpenELIS; an uploaded report is a row of type `EXTERNAL` carrying the file. **FR-15.7** Empty state: "No reports yet. Complete the findings and conclusion to generate one."

**FR-15.8** Report delivery, queueing and print presets are owned by `OGC-1031`; this section lists and opens.

### FR-16 · Localization

Every visible string is wrapped in `t(key, fallback)` per Constitution Principle VII, following the shell's group vocabulary under the `pathology.*` namespace, with shell-shared strings reused from `caseView.*`. The live `PathologyCaseView.jsx` already uses `useIntl()`; existing keys are reused rather than replaced. See the Localization table.

### FR-17 · Audit Trail

Every state-changing action writes an `audit_trail` row. No reads are audited. Actor from Spring Security; no patient identifiers in any payload.

| Action verb | Trigger | Target | Payload summary |
|---|---|---|---|
| `PATHOLOGY_STAGE_ADVANCED` | FR-2.4 | `pathology_sample.id` | `stage_from`, `stage_to` |
| `PATHOLOGY_STAGE_RETURNED` | FR-2.5 | `pathology_sample.id` | `stage_from`, `stage_to`, `reason` |
| `PATHOLOGY_BLOCK_CREATED` | FR-3.3 | `pathology_block.id` | `designation`, `barcode` |
| `PATHOLOGY_BLOCK_EMBEDDED` | FR-6.2 | `pathology_block.id` | `cassette_state` transition |
| `PATHOLOGY_BLOCK_DEACTIVATED` | S-10.4 | `pathology_block.id` | `reason` |
| `PATHOLOGY_SLIDE_CREATED` | FR-7.1 | `pathology_slide.id` | `designation`, `barcode`, `block_id` |
| `PATHOLOGY_SLIDE_LABEL_VERIFIED` | FR-7.3 | `pathology_slide.id` | `block_barcode`, `slide_barcode`, `match` |
| `PATHOLOGY_SLIDE_LABEL_MISMATCH` | FR-7.4 | `pathology_slide.id` | both scanned identifiers |
| `PATHOLOGY_SLIDE_STAINED` | FR-8.1 | `pathology_slide.id` | `stain_id`, `status` |
| `PATHOLOGY_SLIDE_DEACTIVATED` | S-10.4 | `pathology_slide.id` | `reason` |
| `PATHOLOGY_REQUEST_RAISED` | FR-10.2 | `pathology_request.id` | `kind`, `priority`, `target` |
| `PATHOLOGY_REQUEST_STATUS_CHANGED` | FR-10.8 | `pathology_request.id` | `status_from`, `status_to` |
| `PATHOLOGY_REQUEST_OVERRIDDEN` | FR-10.11 | `pathology_sample.id` | list of open request ids |
| `PATHOLOGY_CONSULTATION_REQUESTED` | FR-11.1 | `pathology_consultation.id` | `consulted_user_id`, `pre_treatment` |
| `PATHOLOGY_CONSULTATION_ANSWERED` | FR-11.2 | `pathology_consultation.id` | `outcome` |
| `PATHOLOGY_CONCLUSION_SAVED` | FR-13.1 | `pathology_sample.id` | list of `(type, value)` tuples — no PII |
| `PATHOLOGY_IHC_REFERRED` | FR-13.4 | `pathology_sample.id` | referred case id |
| `PATHOLOGY_CASE_SIGNED_OUT` | FR-15 | `pathology_sample.id` | `stage_from`, `critical_result_emitted` |
| `PATHOLOGY_CASE_REOPENED` | S-8.3 | `pathology_sample.id` | `voided_report_id` |
| `PATHOLOGY_REPORT_GENERATED` | FR-15.3 | `pathology_report.id` | `version`, `type` |
| `PATHOLOGY_CRITICAL_RESULT_EMITTED` | FR-14.3 | `pathology_sample.id` | `conclusion_dictionary_id` |

### FR-18 · Envers coverage

Hibernate Envers `@Audited` on:

- `PathologySample` *(existing entity — **not** currently annotated; must be added, see Dependencies)*
- `PathologyBlock` *(existing entity — not currently annotated; must be added; clinical traceability)*
- `PathologySlide` *(existing entity — not currently annotated; must be added; exclude the `image` column from revisions — binary content, high churn)*
- `PathologyRequest` *(existing entity — not currently annotated; must be added)*
- `PathologyConclusion` *(existing entity — not currently annotated; must be added; diagnostic data)*
- `PathologyStageEvent` *(new — the stage history is itself the record; append-only, so revisions add nothing; **excluded**, with the table's own immutability as the control)*
- `PathologyConsultation` *(new — clinical review outcome, must be audited)*
- `PathologyReport` *(existing — follow the existing pattern for report tables, which cytology also leaves unaudited; the `voided` flag plus the audit verbs carry the history)*

Note the pattern: **none** of the pathology entities are `@Audited` on `develop` today. That is a single backend story, declared in Dependencies, not an assumption this FRS may make silently.

---

## Data Model

### Reused (existing — no schema changes)

| Entity | Table | Notes |
|---|---|---|
| `PathologySample` | `pathology_sample` | extends `ProgramSample` (which extends `Sample`). Already carries `technician` and `pathologist` (`SystemUser` `@OneToOne`), `status` (`PathologyStatus`, `@NotNull`), `grossExam` and `microscopyExam` (String columns), and `@OneToMany` collections for `blocks`, `slides`, `requests`, `techniques`, `conclusions` and `reports`. **No new columns** except the decalcification flag below — the three stage-completion timestamp columns the December 2025 FRS proposed are not added, because stage history lives in `pathology_stage_event`. |
| `PathologyTechnique` | `pathology_technique` | Already ships. The December 2025 FRS declared it a **new** entity. No changes. |
| `PathologyConclusion` | `pathology_conclusion` | Already ships with `value` (String) and `type` (`ConclusionType` ∈ `DICTIONARY` `"D"` / `TEXT` `"T"`). Coded and narrative conclusions are both rows here; several codes are several rows. **No changes** — this is the FRS's largest data-model saving over v1, which proposed a diagnosis model with no entity at all behind it. |
| `PathologyReport` | `pathology_report` | Report rows already collection-mapped on the case. Version, type and voided handled by the additions below. |
| `Dictionary` / `DictionaryCategory` | `dictionary`, `dictionary_category` | Tissue types, stains, diagnosis codes, decalcification agents, consultation reasons are all dictionary content. Malignancy marking for FR-14.1 is a dictionary attribute, not code. |
| `Sample`, `SampleItem`, `TypeOfSample`, `Provider`, `Organization`, `SampleRequester` | existing | FR-1 reads only. |
| Shared sample Storage model | `sample_storage_assignment` etc. | FR-6.4 block storage reuses it per `D-035`. |

### Reused with additions

| Entity | Table | Additions and why |
|---|---|---|
| `PathologyBlock` | `pathology_block` | Ships as `id`, `block_number` (Integer), `location` (String) — that is all. Needs: `designation VARCHAR(32)` (the alphanumeric identifier `block_number` cannot hold, FR-9.3); `barcode VARCHAR(64)` (FR-9.5); `cassette_state VARCHAR(16)` ∈ `CASSETTE`/`BLOCK` (FR-9.1); `tissue_type_id` FK to `dictionary`; `part_designation VARCHAR(16)`; `storage_location_id` FK to the shared storage model, superseding the free-text `location`; `active BOOLEAN NOT NULL DEFAULT true` (S-10.4). |
| `PathologySlide` | `pathology_slide` | Ships as `id`, `slide_number` (Integer), `image` (`byte[]`, `BinaryType`), `file_type` (String), `location` (String). Needs: **`block_id` FK to `pathology_block`** — the parentage that does not exist today and without which FR-9.2 and `ISO 15189` 7.2.6.1(g) are unsatisfiable; `designation VARCHAR(32)`; `barcode VARCHAR(64)`; `level VARCHAR(16)`; `stain_id` FK to `dictionary`; `stain_status VARCHAR(24)`; `label_verified_at TIMESTAMP` and `label_verified_by` FK (FR-7.3); `active BOOLEAN NOT NULL DEFAULT true`. |
| `PathologyRequest` | `pathology_request` | Ships as `id`, `status` (`RequestStatus` ∈ `OPENED`/`COMPLETED`/`CANCELLED`, default `OPENED`), `type` (`RequestType` ∈ `DICTIONARY`/`TEXT`), `value` (String). The shipped `type` describes how `value` is read and is left alone. Needs: `request_kind VARCHAR(16)` ∈ `BLOCK`/`SLIDE`/`STAIN` (FR-10.3 — distinct from `type`); `target_block_id` and `target_slide_id` nullable FKs (FR-10.4); `priority VARCHAR(8)` ∈ `NORMAL`/`URGENT`/`STAT`; `result_block_id` and `result_slide_id` nullable FKs (FR-10.9); `cancel_reason VARCHAR(255)` nullable. The instruction text stays in the existing `value`. |
| `PathologyReport` | `pathology_report` | Needs: `version_number INTEGER`; `report_type VARCHAR(16)` ∈ `DRAFT`/`FINAL`/`EXTERNAL` (FR-15.6); `voided BOOLEAN NOT NULL DEFAULT false` (S-8.4). The December 2025 FRS's `emailed_to` JSON array of addresses is **not** added — delivery is `OGC-1031`'s, and a delivery audit does not belong as a denormalised column on the report row. |

### New (two new entities)

**`PathologyStageEvent`** — `pathology_stage_event`, many rows per `pathology_sample` (1:many), append-only.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | sequence `pathology_stage_event_seq` |
| `pathology_sample_id` | INTEGER FK | not null |
| `stage` | VARCHAR(32) | the `PathologyStatus` value entered |
| `entered_at` | TIMESTAMP | server clock, not null |
| `entered_by` | INTEGER FK `system_user` | from the session, not null |
| `completed_at` | TIMESTAMP | nullable |
| `completed_by` | INTEGER FK `system_user` | nullable |
| `direction` | VARCHAR(8) | `FORWARD` / `RETURN` (FR-2.5) |
| `reason` | VARCHAR(255) | nullable; required when `direction = RETURN` |
| `run_reference` | VARCHAR(64) | nullable; the processor run for FR-5.1 until run management exists |
| `notes` | TEXT | nullable; e.g. decalcification agent and times (FR-4.2) |

This is the entity that satisfies `ISO 15189:2022` 7.3.1(d) — who performed each significant activity, and when — and it is why no per-stage operator or timestamp columns are added to `pathology_sample`. Liquibase changeset `2.9.x.x/pathology_stage_event.xml`. Append-only by design; **not** `@Audited` (see FR-18). No PII columns.

**`PathologyConsultation`** — `pathology_consultation`, many rows per `pathology_sample` (1:many).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | sequence `pathology_consultation_seq` |
| `pathology_sample_id` | INTEGER FK | not null |
| `requested_by` | INTEGER FK `system_user` | not null |
| `consulted_user_id` | INTEGER FK `system_user` | not null |
| `reason_dictionary_id` | INTEGER FK `dictionary` | nullable |
| `pre_treatment` | BOOLEAN | not null; the guideline's "before treatment begins" condition |
| `status` | VARCHAR(16) | `REQUESTED` / `ANSWERED` / `WITHDRAWN` |
| `outcome` | VARCHAR(16) | nullable until answered; `AGREE` / `DISAGREE` / `MODIFIED` |
| `outcome_note` | TEXT | nullable |
| `requested_at`, `answered_at` | TIMESTAMP | server clock |

Two new entities rather than the house-preferred one, and the reason is that they answer different questions and have different lifetimes: the stage event is an append-only operational log with no outcome, and the consultation is a clinical record with a queryable result that a quality programme reports on. Folding the consultation into `pathology_request` was considered and rejected — a request has no outcome dimension, and overloading its status with `AGREE`/`DISAGREE` would corrupt the bench-request queue the dashboard counts. Liquibase changeset `2.9.x.x/pathology_consultation.xml`. `@Audited` via Envers. No PII columns.

### Schema additions (small)

| Change | Reason |
|---|---|
| `pathology_sample` add `decalcification_required BOOLEAN NOT NULL DEFAULT false` | FR-3.2 makes `DECALCIFICATION` reachable |
| *(no column added for the IHC referral)* | FR-13.4 needs none: `immunohistochemistry_sample` already carries `pathology_sample_id` (`@OneToOne`) and a `reffered` boolean — note the schema's spelling — so the link is owned from the IHC side and read from here |
| `PathologyStatus` enum: add `ACCESSIONED`, `DECALCIFICATION`, `EMBEDDING`, `COVERSLIPPING`, `UNDER_REVIEW`; rename `SLICING` → `MICROTOMY`; retire `CUTTING` and `ADDITIONAL_REQUEST` | FR-2.1, with the row mapping in FR-2.2 |
| Remove `orphanRemoval = true` from `PathologySample`'s `blocks`, `slides`, `requests`, `conclusions` and `reports` collections | S-10.4 — today removing a child from the collection hard-deletes the row, against `D-002` and `42 CFR 493.1105` retention (slides 10 years, blocks 2 years) |
| Add `@Audited` to `PathologySample`, `PathologyBlock`, `PathologySlide`, `PathologyRequest`, `PathologyConclusion` | FR-18; none are annotated today |
| Common properties `pathology.stage.<value>.enabled`, `pathology.microtomy.scanVerificationRequired`, `pathology.identifier.*` | FR-2.3, FR-7.5, FR-9.3 |

### Dependencies (named, not designed in this FRS)

| Dependency | Status | What this FRS needs |
|---|---|---|
| **Case View Shell** | New, this pass | Structural conformance per the table above. Shared `PatientHeader`, prior-results panel, action bar, section state model and critical-result contract are defined there, not here. |
| **`PathologyStatus` rework + migration** | New backend story | FR-2 changes an enum the shipped Pathology Dashboard filters on and that `DisplayListService.ListType.PATHOLOGY_STATUS` publishes. Needs the Liquibase mapping in FR-2.2, a dashboard filter update, and a fix to the Cypress fixture that selects `"Processing"` (`frontend/cypress/pages/DashBoard.js`). **This is the largest backend dependency in the FRS and must land before the screen.** |
| **Envers + `orphanRemoval` on pathology entities** | Missing / wrong on `develop` | See Schema additions. One backend story covering both; blocks S-10.4 and FR-18. |
| **Global Critical Result Acknowledgment** | TODO | FR-14.3 emits `CriticalResultEvent`; the consumer and Alerts Dashboard integration are built there. Flag `criticalResultAcknowledgmentEnabled` gates the consumer only. |
| **Shared `barcodeWorkflow` print orchestration** | Built; rollout scheduled | FR-3.3, FR-7.2 and FR-9.4 delegate label printing. `OGC-284` lists Pathology Case View as M8 "Pathology family rollout via shared orchestration"; `PathologyCaseView.jsx` already imports `PostSavePrintDialog`. **Gap:** the Test Catalog Labels picker still filters to `isSystem` presets, so custom presets are unattachable until completion-v2 FR-66 lands. |
| **Label preset content and fields** | `OGC-285` (spec v2.5) | FR-9.4 says what must appear on a block and slide label; which configured fields print is owned there. |
| **Report Print Queue** | `OGC-1031`, anchor `OGC-431` | FR-15 lists and opens reports. Generation, delivery and print presets are owned there. |
| **Macro Library** | `OGC-788`, in progress (`OGC-869` v1, `OGC-871` v2) | FR-3.1 and FR-12.3 consume `.code`-to-text expansion in the gross and microscopic description fields. This FRS defines **no** macro model. **Input to `OGC-871`:** pathology needs field-scoped macro categories so a gross-description macro is not offered in a microscopic field. |
| **Tissue processor run management** | Not built | FR-5.1 records a run reference as free text on the stage event and says so in the UI. A run registry with instrument, program and reagent-lot identity is a separate FRS; when it exists, `run_reference` becomes an FK. |
| **Sample Storage model** | `OGC-657`, PR #3840 open | FR-6.4 block storage reuses it and `LocationPickerModal` per `D-035`. Until merged, block storage stays on the existing free-text `location` and the FRS marks the field as interim. |
| **IHC Case View** | `OGC-265`, converting this pass | FR-13.4 creates the linked IHC case via the **already-existing** `immunohistochemistry_sample.pathology_sample_id` and `reffered` columns. The receiving behaviour is specified in that FRS. Note also that `ImmunohistochemistryCaseViewDisplayItem` already consumes `PathologyBlock` and `PathologySlide` — IHC reads this case's blocks and slides rather than holding its own, so the identifier scheme in FR-9.3 is shared across both screens. |
| **Slide image storage ceiling** | Existing design constraint | `pathology_slide.image` is a `byte[]` column in the row. It supports the single modest attached image in scope and **cannot** hold whole-slide images (which run to gigabytes). If attached-image use grows, moving to file storage is a separate story. Stated so nobody discovers it at load-test time. |
| **`RT Number`** | Unknown | Present in the client's requested design with no known OpenELIS counterpart. Not specified here; an open question for the site before it could be added. |
| **Liquibase changeset `2.9.x.x`** | New | All new schema and the enum migration land under `2.9.x.x`, idempotent. |

---

## Permissions

| Action | Role bundle | Notes |
|---|---|---|
| Open Pathology Case View | `Histopathology` (existing) | `/PathologyCaseView` already registered in `system_module_url` for the `Pathology` module. |
| Save draft | `Histopathology` | Existing. No new per-action key. |
| Advance or return a stage | `Histopathology` | Existing. Which stages a given user *should* work is a matter of lab practice and assignment, not of a permission key. |
| Create or deactivate blocks and slides | `Histopathology` | Existing. |
| Raise or fulfil a bench request | `Histopathology` | Existing. The requester/fulfiller distinction is workflow, not permission. |
| Request or answer a consultation | `Histopathology` | Existing. |
| Enter findings and conclusion, sign out | `Histopathology` | Existing. Capability follows case status, not a second permission axis: before `READY_PATHOLOGIST` the bench sections are editable and Review and Findings are disabled; from `READY_PATHOLOGIST` the reverse. |
| Reopen a completed case | `Histopathology` | Same bundle — no separate reopen key, per S-8.3. |
| Add a dictionary entry (tissue type, stain, diagnosis) | existing dictionary-entry permission | FR-13.2. A user without it sees the add option disabled with the reason. |

**Roles Builder additions:** None. Accessible via the existing `Histopathology` bundle. The December 2025 FRS proposed **twenty-one** invented `pathology.*` per-action keys (`pathology.case.view`, `pathology.requests.revert`, `pathology.macros.share`, …) plus a twenty-second cited in its body and absent from its own table. OpenELIS has no per-action permission keys; see the Constitution's role model and `D-006`.

**Verification note:** `OGC-9` was a live bug in which a user holding all Histopathology-section permissions was refused the Pathology Dashboard. The bundle's exact name and grants should be re-confirmed against the running app before implementation rather than taken from this table.

---

## Acceptance Criteria

Each AC traces to one or more FRs.

| AC | Statement | Traces to |
|---|---|---|
| AC-1 | The screen loads at `/PathologyCaseView/:pathologySampleId` and renders the patient header, prior-results panel, progress rail, eleven work sections, Case Summary and action bar | Layout, S-1, S-2, S-5 |
| AC-2 | Section state is computed from `pathology_sample.status` and the user's role bundle; no completion boolean or per-section completion column exists in the schema | FR-2, S-4.1 |
| AC-3 | Every disabled section shows a localized `lockedHint` naming the stage or condition being waited on; no section is removed from the DOM on the basis of state | FR-12.1, S-3.3, S-4.2 |
| AC-4 | The rail, the section badges, the Case Summary stage row, the action bar status and the Pathology Dashboard filter all read the same `status` value and never disagree | FR-2.6, S-4.1 |
| AC-5 | `PathologyStatus` contains the eleven values in FR-2.1; `CUTTING`, `SLICING` and `ADDITIONAL_REQUEST` no longer exist; the migration maps existing rows per FR-2.2 with no row left on a retired value | FR-2.1, FR-2.2 |
| AC-6 | A case with one or more `pathology_request` rows at `OPENED` shows the open-request flag at its actual stage; no case is placed in a status to represent an outstanding request | FR-2.1, FR-10.10 |
| AC-7 | Setting `pathology.stage.<value>.enabled` to false causes the forward transition to skip that stage and the rail to render it `n/a`; `ACCESSIONED`, `GROSSING`, `READY_PATHOLOGIST` and `COMPLETED` cannot be disabled | FR-2.3 |
| AC-8 | Every stage entry, exit and return writes a `pathology_stage_event` row whose `entered_by` is the session user and whose `entered_at` is the server clock; no operator name or stage date is user-editable anywhere on the screen | FR-2.4, S-8.2 |
| AC-9 | A stage return requires a reason and is recorded with `direction = RETURN` | FR-2.5 |
| AC-10 | A cassette created at grossing and the block it becomes at embedding are the same `pathology_block` row, with the same `id`, `designation` and `barcode`, and `cassette_state` transitioning `CASSETTE` → `BLOCK` | FR-9.1, FR-6.1 |
| AC-11 | Every `pathology_slide` row references the `pathology_block` it was cut from via `block_id` | FR-9.2 |
| AC-12 | No count of cassettes, blocks or slides is stored in any column or entered in any input; every count rendered is computed over rows | FR-9.6, S-10.3 |
| AC-13 | An incomplete handoff states the count *and* names the outstanding object — e.g. "3 of 4 embedded — block A4 outstanding" | FR-6.3 |
| AC-14 | Block and slide designations are alphanumeric strings honouring the configured scheme, unique within their parent, and stored alongside a resolved `barcode` | FR-9.3, FR-9.5 |
| AC-15 | At microtomy, committing a slide row requires a block scan and a verified slide-label scan; `label_verified_at` and `label_verified_by` are recorded on success | FR-7.3 |
| AC-16 | A scan mismatch blocks the commit, shows an error notification naming both scanned identifiers, and writes `PATHOLOGY_SLIDE_LABEL_MISMATCH` | FR-7.4 |
| AC-17 | With `pathology.microtomy.scanVerificationRequired` false, verification degrades to an explicit two-field confirmation that still writes the audit record | FR-7.5 |
| AC-18 | A bench request is created from an inline row in the requests table, not a modal; the target typeahead offers only objects valid for the selected kind | FR-10.2, FR-10.4 |
| AC-19 | Stain type is present only when the request kind is `STAIN`; the instruction field is required | FR-10.5, FR-10.6 |
| AC-20 | Sending a case to the pathologist with open requests requires a confirmation listing each open request by its instruction, and writes `PATHOLOGY_REQUEST_OVERRIDDEN` | FR-10.11 |
| AC-21 | A consultation records the consulted user, the pre-treatment flag, and on answer an `outcome` of `AGREE`, `DISAGREE` or `MODIFIED` as a queryable column | FR-11.1, FR-11.2 |
| AC-22 | A configured review-trigger rule suggests a consultation and never blocks sign-out | FR-11.3 |
| AC-23 | Macroscopic and microscopic findings persist to the existing `pathology_sample.grossExam` and `microscopyExam` columns; no duplicate gross-description field exists on the screen | FR-12.3 |
| AC-24 | A coded conclusion persists as a `pathology_conclusion` row with `type = DICTIONARY`; several codes persist as several rows; no new diagnosis table is created | FR-13.1 |
| AC-25 | Selected techniques and conclusions render as removable labelled chips; no selection anywhere on the screen is shown only as a count | FR-12.4, FR-13.2 |
| AC-26 | A malignant coded conclusion renders a persistent `role="alert"` warning notification and, on sign-out, emits `CriticalResultEvent`; sign-out succeeds with `criticalResultAcknowledgmentEnabled` false | FR-14 |
| AC-27 | A report row opens in a new browser tab on a single click; the row exposes no View, Download, Print or Email buttons | FR-15.2 |
| AC-28 | `Generate report` opens the generated report in a new tab, adds a version row, and is disabled only when a description is empty or no conclusion exists — the same condition its tooltip states | FR-15.3, FR-15.4 |
| AC-29 | Blocks, slides, requests, conclusions and reports are deactivated or voided, never deleted; lists hide deactivated rows behind an explicit "Show deactivated" toggle; no collection uses `orphanRemoval` | S-10.4 |
| AC-30 | Every visible string resolves through `t(key, fallback)` with a key present in the Localization table; no hardcoded user-facing English remains | FR-16 |
| AC-31 | No new per-action permission key is introduced; access is gated by the existing `Histopathology` role bundle | Permissions |
| AC-32 | Every form field has a label; every icon-only action has an `aria-label`; every badge conveys state in text as well as colour; section headers expose `aria-expanded`; the critical banner uses `role="alert"` | NFR |

---

## Localization

New i18n keys follow the shell's group vocabulary under the `pathology.*` namespace; shell-shared strings are reused from `caseView.*`. New keys are added to `frontend/src/languages/en.json` and propagated to fr/es/sw/ta/de/zh/ro/si. Existing keys reused where present — the live component already uses `useIntl()`.

| Key | English fallback | Reused? |
|---|---|---|
| `pathology.label.case` | Pathology Case | existing |
| `pathology.label.dashboard` | Pathology Dashboard | existing |
| `pathology.section.caseInfo` | Case Information | new |
| `pathology.section.grossing` | Grossing | new |
| `pathology.section.decalcification` | Decalcification | new |
| `pathology.section.processing` | Processing | new |
| `pathology.section.embedding` | Embedding | new |
| `pathology.section.microtomy` | Microtomy | new |
| `pathology.section.staining` | Staining | new |
| `pathology.section.coverslipping` | Coverslipping & QC | new |
| `pathology.section.review` | Pathologist Review | new |
| `pathology.section.findings` | Findings & Conclusion | new |
| `pathology.section.reports` | Reports | new |
| `pathology.stage.accessioned` | Accessioned | new |
| `pathology.stage.grossing` | Grossing | existing |
| `pathology.stage.decalcification` | Decalcification | new |
| `pathology.stage.processing` | Processing | existing |
| `pathology.stage.embedding` | Embedding | new |
| `pathology.stage.microtomy` | Microtomy | existing (`pathology.stage.slicing` — relabelled) |
| `pathology.stage.staining` | Staining | existing |
| `pathology.stage.coverslipping` | Coverslipping & QC | new |
| `pathology.stage.readyPathologist` | Ready for Pathologist | existing |
| `pathology.stage.underReview` | Under Pathologist Review | new |
| `pathology.stage.completed` | Completed | existing |
| `pathology.action.sendForProcessing` | Send for processing | new |
| `pathology.action.sendForEmbedding` | Send for embedding | new |
| `pathology.action.sendToMicrotomy` | Send to microtomy | new |
| `pathology.action.sendForStaining` | Send for staining | new |
| `pathology.action.sendToPathologist` | Send to pathologist | new |
| `pathology.action.returnStage` | Return to previous stage | new |
| `pathology.action.signOut` | Sign out & finalize | new |
| `pathology.action.generateReport` | Generate report | new |
| `pathology.action.addCassette` | Add cassette | new |
| `pathology.action.addSlide` | Add slide | new |
| `pathology.action.embed` | Embed | new |
| `pathology.action.printLabel` | Print label | new |
| `pathology.action.requestWork` | New request | new |
| `pathology.action.requestConsultation` | Request second opinion | new |
| `pathology.label.blockDesignation` | Block | new |
| `pathology.label.slideDesignation` | Slide | new |
| `pathology.label.barcode` | Barcode | new |
| `pathology.label.tissueType` | Tissue type | new |
| `pathology.label.stain` | Stain | new |
| `pathology.label.level` | Level | new |
| `pathology.label.storageLocation` | Storage location | new |
| `pathology.label.grossExam` | Macroscopic description | new |
| `pathology.label.microscopyExam` | Microscopic description | new |
| `pathology.label.conclusion` | Conclusion | new |
| `pathology.label.codedConclusion` | Coded conclusion | new |
| `pathology.label.techniques` | Techniques used | new |
| `pathology.label.referIhc` | Refer to Immunohistochemistry | new |
| `pathology.label.requestKind` | Request type | new |
| `pathology.label.requestTarget` | Target | new |
| `pathology.label.requestInstruction` | Instruction | new |
| `pathology.label.priority` | Priority | new |
| `pathology.label.consultedPathologist` | Consulting pathologist | new |
| `pathology.label.consultationOutcome` | Outcome | new |
| `pathology.label.preTreatment` | Requested before treatment | new |
| `pathology.label.runReference` | Processor run | new |
| `pathology.badge.embeddedOf` | {embedded} of {total} embedded | new |
| `pathology.badge.stainedOf` | {stained} of {total} stained | new |
| `pathology.badge.outstanding` | {designation} outstanding | new |
| `pathology.locked.awaitingStage` | Available once the case reaches {stage} | new |
| `pathology.locked.decalcNotRequired` | Not required for this specimen | new |
| `pathology.locked.stageDisabled` | Not tracked at this laboratory | new |
| `pathology.banner.criticalResult` | This conclusion requires critical-result acknowledgment by the ordering clinician. The case will be flagged in the Alerts Dashboard on sign-out. | new |
| `pathology.banner.labelMismatch` | Scanned slide label {slideBarcode} does not match block {blockBarcode}. The slide was not created. | new |
| `pathology.banner.openRequests` | This case has {count} open bench requests. Sending it to the pathologist will show them as incomplete. | new |
| `pathology.banner.runReferenceInterim` | Processor runs are not yet managed in OpenELIS. Record the run reference as it appears on the instrument. | new |
| `pathology.empty.noReports` | No reports yet. Complete the findings and conclusion to generate one. | new |
| `pathology.empty.noPriorResults` | No prior anatomic-pathology results for this patient. | new |
| `pathology.empty.noRequests` | No bench requests on this case. | new |

79 keys: 8 existing (7 reused as-is, 1 relabelled), 71 new. Shell-shared action-bar, prior-results and deactivated-toggle strings are additional and live under `caseView.*`.

---

## Non-functional Requirements

| Aspect | Target |
|---|---|
| Initial load | First contentful paint ≤ 1.5 s on a 4G connection from a 1× CPU mobile-class device (typical site profile in resource-constrained labs). Existing `PathologyCaseView` baseline; the redesign must not regress it. |
| Save draft | ≤ 500 ms server response on a case with ≤ 40 blocks and slides combined. |
| Sign-out | ≤ 2.0 s including report generation. |
| Scan verification | ≤ 300 ms from scan to match result at the microtome — this is a bench interaction with a blade in the technician's other hand, and latency here is what makes people stop using it. |
| Case size | A case with 30 blocks and 90 slides renders without pagination in the microtomy section; the section virtualises above that. |
| Accessibility | WCAG 2.1 AA. All form fields labelled; section headers keyboard-operable with `aria-expanded`; every icon-only action carries an `aria-label` in addition to any `title`; every badge and status Tag conveys state in text as well as colour; the critical-result banner is announced via `role="alert"`; the one permitted modal (destructive confirmation) traps focus, carries `role="dialog"` and closes on Escape. |
| Localization | All shipped UI locales (en, fr, es, sw, ta, de, zh, ro, si). |
| Browser | Chrome / Edge / Firefox latest; tablet Safari read-only. Bench stages assume a desktop or a fixed scanner station. |

---

## What changed vs v1 FRS (December 2025)

For reviewers comparing this revision to the prior FRS at `designs/pathology/pathology-case-view.md`:

| Area | v1 | v2 (this FRS) |
|---|---|---|
| **Workflow model** | Eight ad-hoc page sections with a `caseReadyForReview` boolean and three new stage-timestamp columns; the shipped `PathologyStatus` enum never mentioned | The shipped `PathologyStatus` enum, reworked to the canonical bench sequence (11 values, `EMBEDDING` added, `CUTTING`/`SLICING` resolved, `ADDITIONAL_REQUEST` retired to a derived flag), with per-deployment stage enablement and stage history in one append-only table |
| **Bench stages** | Grossing, then two static tables of blocks and slides — processing, embedding and microtomy invisible | Grossing, optional decalcification, processing, embedding, microtomy, staining, coverslipping — the sequence the lab actually runs |
| **Data model** | Invented `PathologistRequest` alongside the shipping `PathologyRequest`; declared the shipping `PathologyTechnique` as new; 24 hardcoded diagnoses with ICD-10 and SNOMED and **no entity behind them**; a full `SlideScan` WSI entity | Reuses `PathologySample`, `PathologyBlock`, `PathologySlide`, `PathologyRequest`, `PathologyConclusion`, `PathologyTechnique`, `PathologyReport`; coded conclusions are `pathology_conclusion` rows with `type = DICTIONARY`; two new tables only (`pathology_stage_event`, `pathology_consultation`) |
| **Object identity** | Blocks and slides as flat tables with integer numbers, no parentage, no barcode generated on creation, and a `Remove` button on both | Cassette-and-block as one row with continuous identity; slides reference their parent block; configurable alphanumeric designations with stored barcodes; deactivate, never delete |
| **Counts** | Not addressed; the client's requested design uses typed per-stage counts | Every count derived from rows; reconciliation names the outstanding object — `ISO 15189:2022` 7.2.6.1(g) |
| **Slide labelling** | A batch "Print Labels" modal from a toolbar, plus its own §10 admin spec for label presets | Scan-verified at the microtome before sectioning, where the published error concentration is; printing delegated to the shared `barcodeWorkflow`, presets to `OGC-285` |
| **Operator attribution** | One case-level Assigned Technician | Per-stage operator and timestamp captured from the session and server clock — `ISO 15189:2022` 7.3.1(d) |
| **Interaction model** | 13 modals, inline row expansion used nowhere, one modal wired to a button with no body behind it | Accordion sections; inline rows for edits and in-context additions; modals only for destructive confirmation |
| **Reports** | Five specified row actions (View/Download/Print/Email/Re-generate), four of them rendered as inert emoji buttons, a hand-drawn HTML facsimile in place of a viewer, an `emailed_to` JSON column, and a Generate button that could never enable | One click opens the report in a new tab; generation opens the new version in a new tab; versions retained; delivery owned by `OGC-1031`; gated on the condition its tooltip names |
| **Requests** | A modal with an unfiltered flat `select` of every block and slide, always-visible stain field, and tooltips reversing who requests from whom | Inline row in the requests table on the existing entity, target typeahead filtered by kind, stain field conditional, copy corrected |
| **Second opinion** | Absent | `pathology_consultation` with a queryable `AGREE`/`DISAGREE`/`MODIFIED` outcome and a pre-treatment flag, per CAP/ADASP interpretive-error guidance |
| **Prior patient results** | Absent | Cross-bench prior anatomic-pathology results in the header, as a shell element |
| **Macros** | A parallel macro system: 2 entities, 11 endpoints, 15 ACs, a management modal, a quick-insert bar repeated five times | Declared dependency on `OGC-788`; this FRS names only which fields consume expansion |
| **Digital pathology** | 19 of 111 ACs on whole-slide imaging — 2 GB uploads, tile endpoint, multi-scan, preferred-scan preference, scanner metadata — while §11 listed it as out of scope for v1 | One attached image per slide, which `pathology_slide.image` already supports; the storage ceiling stated in Dependencies; WSI out of scope and named as such once |
| **Requirements structure** | No FR ids at all; 111 flat ACs; §5.1 stating `PathologyCase` had no changes while §5.3 added three columns to it | 18 FRs with 32 traceable ACs; Shell Conformance table; internally consistent data model |
| **Roles** | 21 invented `pathology.*` per-action permission keys, plus a 22nd cited in the body and missing from its own table; zero role gating in the mockup | The existing `Histopathology` bundle; capability follows case status; no new keys (`D-006`) |
| **Carbon** | No `@carbon/react` import at all — raw divs with hand-copied Carbon hex values in inline styles | Carbon components named per requirement, per Constitution Principle II |
| **i18n** | Zero keys, zero namespace, no Localization section — a regression on the shipped component's existing `useIntl()` | 79 keys, 8 reused, full Localization table, shell group vocabulary |
| **Audit / Envers** | Not declared | 21 `audit_trail` verbs; Envers declared per entity, with the finding that **no** pathology entity is annotated today |
| **Critical results** | Not mentioned | `CriticalResultEvent` on malignant conclusion, behind the shared feature flag, never blocking sign-out |
| **Route** | `/PathologyCaseView/:caseId` | `/PathologyCaseView/:pathologySampleId` — matches the live route and the service signature |
| **Lab Context** | Absent | Three-subsection developer onboarding narrative as the first section |

---

## Related and prior art

- **Case View Shell** (`case-view-shell.md`) — the structural contract this screen implements; see Shell Conformance. This screen is the shell's most demanding adopter and the only one rendering the progress rail.
- **Cytology Case View v2.0** (`designs/pathology/cytology-case-view.md`) — sibling case-detail screen and the origin of the critical-result hook. Its `Related and prior art` currently names the December 2025 pathology FRS as "the parent design pattern"; that bullet should be re-pointed at the shell.
- **IHC Case View v2** (`OGC-265`) — sibling screen and the destination of FR-13.4's referral. Converting in the same pass.
- **Barcode label quantity management** (`OGC-284`) / **Label presets** (`OGC-285`) — own label printing and preset content; this FRS delegates both.
- **Macro Library** (`OGC-788`) — owns text expansion in FR-3.1 and FR-12.3.
- **Report Print Queue** (`OGC-1031`, anchor `OGC-431`) — owns report delivery.
- **Global Critical Result Acknowledgment** — receiver of the event emitted by FR-14.3.
- **Sample Storage model** (`OGC-657`) — owns block storage location per `D-035`.
- **The client's requested design** (Figma, Mauritius Regional LIS) — used as a **content guide only**. Its stage sequence is closer to the real bench than the December 2025 design and is adopted; its typed per-stage counts, tab-strip navigation and editable Personnel and Date fields are not, for the reasons given in FR-9.6, Layout and FR-2.4.

---

*End of FRS — v2.0, 2026-09-04*
