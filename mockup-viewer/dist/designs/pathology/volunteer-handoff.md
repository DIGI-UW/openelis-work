# Pathology Case View v2 — Contributor Handoff

**For:** a community volunteer who already contributes to OpenELIS and knows the build, the Carbon and i18n conventions and the PR process, but has not worked in the pathology module.
**Scope:** the Case View Shell plus the Pathology Case View. **IHC is not in this handoff** — see *Why IHC is held* below.
**Epic:** `OGC-264`

Everything you need is in `openelis-work/Claude outputs/pathology-v2/`:

| File | What it is |
|---|---|
| `pathology-case-view-v2.md` | the specification — 18 FRs, 32 acceptance criteria |
| `case-view-shell.md` | the shared structural contract the screen implements |
| `pathology-case-view-breakdown.md` | suggested slicing, in dependency order |
| `pathology-case-view-v2-preview.html` | open in any browser; no build step |
| `pathology-case-view-mockup.jsx` | Carbon reference implementation |
| `closing-actions.md` | registry and decision-log deltas; not your work, but explains the surrounding decisions |

Start with the preview, then the FRS's Lab Context, then the breakdown. The preview's two dark controls at the top let you move the case through all eleven stages and switch role — they exist only in the preview, to show the state model.

---

## What a histopathology lab actually does

You are building the screen that tracks a piece of human tissue from the moment it arrives to the moment a pathologist signs a diagnosis. Five minutes of domain will save you a lot of guessing.

A surgeon removes tissue, drops it in formalin, and sends it over. It arrives as a wet lump. A pathologist or senior technician **grosses** it: describes it aloud, then dissects it and puts selected pieces into small perforated plastic **cassettes** — postage-stamp sized. A liver core might make one cassette; a resected colon thirty. The cassettes go into a **tissue processor** overnight, eight to fourteen hours, which soaks the tissue through alcohols and solvents into hot paraffin wax so it becomes firm enough to slice. That is a batch: one run holds cassettes from many patients.

Next morning a technician **embeds** each cassette — the wax-infiltrated tissue is oriented in a mould, topped with molten wax, chilled into a solid **block**. Here is the thing most people get wrong on first read: **the block is the same physical object the cassette was.** The cassette becomes the block's base. That is why the design gives them one row and one barcode with a `cassette_state` that moves `CASSETTE` → `BLOCK`, rather than two entities.

A technician then takes each block to a **microtome**, a precision blade that shaves ribbons of tissue two to five microns thick, and floats those sections onto glass **slides**. The slides are **stained** — routinely haematoxylin and eosin, which turns nuclei blue and cytoplasm pink — then coverslipped, checked, and delivered to the pathologist, who reads them down a microscope and writes the report.

So the hierarchy is: **case → part → block → slide**. One case, several parts, several blocks per part, several slides per block. Every one of those is a physical object someone can lose.

Two vocabulary notes that will trip you up in the code. **"Gross" means macroscopic** — the naked-eye description — not "disgusting"; `grossExam` is that field. And **"macro" in this codebase means a typing shortcut**, not the macroscopic description; that is the Macro Library (`OGC-788`) and it is somebody else's epic.

---

## The two rules that shape everything

**1. Identified objects, never counts.** This is not a style preference. `ISO 15189:2022` clause 7.2.6.1(g) requires that every portion of a sample be unequivocally traceable to the original sample. A field recording "blocks embedded = 3" cannot say *which* three, and therefore cannot say which one is missing. So blocks and slides are rows with their own identity, parentage and barcode, and **every count on the screen is computed over those rows.** If you find yourself adding a count column or a count input, something has gone wrong.

The client design this replaces did it the other way — typed counts at each stage — and the reconciliation it produced could tell you three of four blocks were embedded but not which. That is the single biggest change between the old design and this one.

**2. No hard delete.** Blocks, slides, requests, conclusions and reports are deactivated or voided, never destroyed. Beyond audit and traceability, `42 CFR 493.1105` requires histopathology slides retained **10 years** and blocks **2 years**.

Which brings us to the thing you will discover in slice 4 and should know about now: `PathologySample` currently declares its `blocks`, `slides`, `requests`, `conclusions` and `reports` collections as `@OneToMany(cascade = ALL, orphanRemoval = true)`. **Removing a child from one of those collections hard-deletes the row.** And none of the pathology entities are `@Audited`. Both are fixed in slice 4; neither is your mistake, and neither should be worked around.

---

## The entity landscape — what already exists

The most important thing to internalise: **far more exists in `develop` than the December 2025 design assumed**, and that design's central failure was inventing parallel versions of things already shipping. Reuse is the default.

Under `src/main/java/org/openelisglobal/program/valueholder/pathology/`:

| Entity | What it holds today | Note |
|---|---|---|
| `PathologySample` | `technician`, `pathologist` (`SystemUser`), `status` (`PathologyStatus`), `grossExam`, `microscopyExam`, plus `@OneToMany` collections for blocks, slides, requests, techniques, conclusions, reports | extends `ProgramSample` extends `Sample`. **Not `@Audited`.** |
| `PathologyBlock` | `id`, `blockNumber` (Integer), `location` (String) | that is genuinely all — no barcode, no tissue type, no state |
| `PathologySlide` | `id`, `slideNumber` (Integer), `image` (`byte[]`), `fileType`, `location` | **no reference to a block.** Both blocks and slides hang directly off the case |
| `PathologyRequest` | `status` (`OPENED`/`COMPLETED`/`CANCELLED`), `type` (`DICTIONARY`/`TEXT`), `value` | the bench-request table already exists — extend it, do not replace it |
| `PathologyConclusion` | `value`, `type` (`DICTIONARY`/`TEXT`) | coded conclusions are rows here with `type = DICTIONARY`. No new diagnosis table needed |
| `PathologyTechnique` | — | already ships; the old FRS wrongly called it new |
| `PathologyReport` | collection on the case | needs version/type/voided added |

`PathologyStatus` on `PathologySample` already has eight values and the Pathology Dashboard already filters on them — there is even a Cypress test selecting `"Processing"`. Slice 1 reworks that enum; it does not introduce the concept.

The live screen is `frontend/src/components/pathology/PathologyCaseView.jsx`. It already uses `useIntl()`, so **do not regress localization** — the December 2025 design had zero i18n keys, which would have been a step backwards from what ships.

Route: `/PathologyCaseView/:pathologySampleId`. Not `:caseId`. The service signature is `PathologyDisplayService.convertToCaseDisplayItem(Integer pathologySampleId)`, and `/PathologyCaseView` is registered in `system_module_url` in `liquibase/2.8.x.x/pathology.xml`.

---

## Conventions specific to this work

You know the general ones. These are the ones this module gets wrong often enough to call out:

**Permissions.** OpenELIS has binary admin plus per-module role bundles. There are **no per-action permission keys.** The December 2025 FRS invented twenty-one of them (`pathology.case.view`, `pathology.requests.revert`, …). This screen is gated by the existing **`Histopathology`** bundle, and capability within it follows case status rather than a second permission axis. Worth knowing: `OGC-9` was a real bug about that bundle's grants, so confirm against a running instance rather than trusting any document.

**Operator attribution is captured, never typed.** `ISO 15189:2022` 7.3.1(d) requires recording who performed each significant activity. That means the session user and the server clock. If you see a Personnel text field or a Date filled input in a screenshot of the client's design — and you will — that is the thing this design deliberately does not do.

**Sections disable, they never disappear.** A stage the user cannot act on yet renders with a stated reason in a `lockedHint`. Never remove a section from the DOM based on state or role; the workflow has to stay legible to whoever opens the case.

**State is derived, never stored twice.** Section state comes from `pathology_sample.status` plus the role bundle. The old design stored a `caseReadyForReview` boolean *alongside* the status enum, they never synchronised, and the result was a screen whose sections unlocked while the sidebar still showed a padlock and whose Generate Report button could never enable. Do not add a second source of truth about progress.

**A disabled button's condition must be the condition its tooltip states.** Same bug, different symptom: the old Generate Report tested case status while its tooltip named the findings fields.

**Labels, not bare counts.** A badge or a batch confirmation names what it is talking about — "cassette A4 outstanding", not "1 remaining". Selections render as removable labelled chips.

**Large or growing sets get a typeahead**, not a native `<select>`. Stains, diagnoses, tissue types, users. The old design put fourteen stains in a static select with a note that the real catalogue is configurable.

---

## Where the seams are — what is not yours to build

This is the part worth reading twice, because the fastest way to waste a fortnight here is to build something another epic owns.

- **Label printing.** `PathologyCaseView.jsx` already imports `PostSavePrintDialog` from `../barcodeWorkflow/`, and `OGC-284` schedules this screen as M8, "Pathology family rollout via shared orchestration". Your job is to say what the label's subject is and call the shared flow. Do not build a print dialog. The old design built two, plus its own label-preset admin section, all of which duplicates delivered work.
- **Text macros.** `OGC-788` is in progress and cross-cutting. Your fields are macro-ready; the engine is not yours. The old design specced a parallel macro system with two entities, eleven endpoints and a management modal.
- **Report delivery, queueing, print presets.** `OGC-1031`, anchor `OGC-431`. You list report versions and open one.
- **Storage locations.** The shared sample Storage model, `OGC-657` (PR #3840 open), with a shared `LocationPickerModal`. Until it merges, leave block storage on the existing free-text `location` and mark it interim.
- **Critical-result acknowledgment.** You **emit** `CriticalResultEvent`. The consumer and the Alerts Dashboard are built elsewhere. `criticalResultAcknowledgmentEnabled` gates only that consumer, and **sign-out is never blocked** by the feature being absent.
- **Processor run registry.** Does not exist. Record the run reference as free text on the stage event and show the banner saying so. Do not build a run registry.
- **Whole-slide imaging.** Out of scope. `pathology_slide.image` is a `byte[]` in the row, which supports one modest attached image and cannot hold a multi-gigabyte scan. If that ever needs to grow it is a separate story.

---

## Why IHC is held

The IHC screen's spec is written (`ihc-case-view-v2.md`) but is not in this handoff, on purpose.

IHC scores markers like ER, HER2 and Ki-67, and a raw number there only becomes a clinical result when an externally published guideline threshold is applied to it. Those thresholds get revised — the HER2 guideline has four editions, and the 2018 one abolished a whole result category. The current IHC design hardcodes a Ki-67 cutoff of 20% in three places, and that cutoff is no longer supported by the guideline body or by any regulatory requirement.

The fix is to make thresholds versioned reference data, and that mechanism lives in the Catalog Subscription epic — the same mechanism that serves antimicrobial breakpoints. Handing IHC out before it exists would mean somebody compiling guideline numbers into the application again, which is exactly the problem. So: pathology first, IHC when the mechanism lands.

You can see what it will look like in the IHC preview if you're curious — switching the HER2 ISH threshold set without touching the numbers changes the clinical answer, which is the whole argument.

---

## Definition of done, per slice

- Every acceptance criterion the slice claims, from the FRS's 32
- Every visible string through `t(key, fallback)` with the key in the FRS Localization table
- Carbon components by name — no hand-rolled equivalents, no hardcoded hex
- Every icon-only action carries an `aria-label`, not just a `title`; section headers expose `aria-expanded`; badges convey state in text as well as colour
- The audit verbs the slice emits, from FR-17
- No new per-action permission key
- No stored count, and no count input
- No hard delete of a domain record

## Questions worth asking before you start

Reasonable things to be unsure about, with who to ask:

1. Which stages does the target deployment actually track separately? (`pathology.stage.*.enabled` — ask Casey; sites differ, and `COVERSLIPPING` in particular is often not tracked)
2. What designation scheme should the default configuration ship with? The CAP/NSH guideline explicitly declined to set a universal one, so this is a real choice, not a lookup
3. Is there a scanner at the target site, or does slice 9 need its degraded two-field path from day one?
4. `RT Number` appears in the client's design with no known OpenELIS counterpart — is it a real requirement, and if so what is it?

---

*Handoff prepared 2026-09-04. Questions on the specs to Casey; the FRSs are the contract, this document is orientation.*
