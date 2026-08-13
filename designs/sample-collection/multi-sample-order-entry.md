# Multiple Samples per Test at Order Entry — Functional Requirements Specification

**Version:** 1.1
**Date:** 2026-08-12
**Author:** OpenELIS Global product design
**Status:** Draft for review
**Affects:** Add Order (`/SamplePatientEntry`), Edit Order, specimen labels, result entry display

**Changelog**

- **1.1 (2026-08-12)** — Incorporates the `/analyze` cross-artifact pass. Localization table
  rewritten against the real `frontend/src/languages/en.json` on `develop` (the `common.*` keys
  previously claimed as REUSE do not exist in the repo). Three further new data elements declared
  in Dependencies. Sample identity settled: the displayed position is the sample's sort order, the
  same number printed on the label. Storage location moved from per-sample to per-group. Breadcrumb
  corrected to the two crumbs the shipped page renders. Void capability restated on its own terms.
  Cross-feature dependencies added for aliquoting, Env/Vector order entry, and Order Entry
  configuration.
- **1.0 (2026-08-12)** — First draft.

---

## Lab Context

### Current State

When a sample arrives at the laboratory, someone at reception opens the **Add Order** page in
OpenELIS, finds or registers the patient, chooses what kind of sample it is (urine, blood,
sputum, stool), and ticks the tests that should be run on it. That produces one specimen record,
one barcode label for the tube or cup, and one result slot per test.

That works when a test needs one sample. Many routine laboratory investigations do not.
Tuberculosis (TB) screening by sputum smear microscopy collects two or three separate sputum
specimens — typically one on the spot and one first thing the next morning — and a laboratory
technician examines and grades **each specimen separately**, because a single positive out of
three is enough to diagnose the patient. A stool examination for intestinal parasites (ova and
parasites, "O&P") collects three specimens on alternate days for the same reason. A timed urine
study collects several urine samples at defined points in the day. A glucose tolerance test
draws blood at fasting, one hour, and two hours. Blood cultures are drawn as two or three sets.

Today the only way to record this in OpenELIS is to press **Add Sample** once per specimen and
fill the entire sample form out again each time — sample type, quantity, unit, collection date,
collection time, collector, collection method, temperature, specimen origin, and the full list
of tests and panels. Roughly a dozen fields, re-entered identically, two or three times over. In
practice most laboratories do one of three things instead: they register a separate order per
specimen, they register a single sample and write "1 of 3" on the tube in marker pen, or they
simply record whichever specimen came back positive and discard the record of the others.

### Pain

The re-entry is the visible cost, but the damage is downstream. When three urine specimens are
registered as three identical "Urine" blocks, nothing in OpenELIS distinguishes them — the
07:00 collection, the midday collection, and the post-exercise collection look the same in the
worklist, on the label, at result entry, and on the patient report. A technician holding three
identical cups has to rely on the marker pen. When the three are registered as three separate
orders, they get three separate lab numbers and the clinician receives three unrelated reports
with no indication that they belong to one study.

The clinical consequence is sharpest in TB. The World Health Organization's smear microscopy
protocol depends on knowing *which* specimen was positive — a positive morning specimen and a
negative spot specimen is a different clinical picture from the reverse, and the national TB
register has a column per specimen for exactly this reason. OpenELIS currently cannot record
that, so laboratories running TB programmes keep a parallel paper register, and the paper
register is what gets reported to the programme.

### What Changes

The person at reception chooses "Urine" once, ticks the tests once, and then clicks **Add
another sample** twice. Three numbered rows appear inside the same urine block. Each row carries
its own collection time and a short free-text description the collector types — "0700 void",
"midday", "post-exercise" — and each row inherits the rest of the collection details from the
row above so nothing is typed twice. Three labels print, each showing its number and its
description. Three results come back, one per specimen, each tied to the specimen it came from.

If the collector realises at the bench that a fourth specimen is needed, they open the order and
add a fourth row; the tests already on the order are automatically set up for it. Nothing is
re-keyed, nothing is written in marker pen, and the report shows the clinician which specimen
gave which result.

---

## Overview

This specification extends the **Add Order** page so that one order can carry several samples of
the same sample type, each individually identified, timed, labelled, and resulted, without the
collector re-entering the sample form for each one.

The change is deliberately narrow. It does not touch the test catalog — the number of samples a
test needs is obvious to the person collecting them and varies by protocol, patient, and
programme, so it is a decision made at collection time rather than configured per test. It does
not change how a test is associated with a sample type. It does not introduce pooled or composite
collections. It adds a small number of new pieces of information to a sample (see Dependencies),
reuses everything else that OpenELIS already records per sample, and reorganises the Add Order
samples section so that adding a second collection of the same kind takes one click instead of a
dozen fields.

### Navigation & URL

- **SideNav placement:** `Order → Add Order` (unchanged — this modifies the existing page)
- **Breadcrumb:** `Home / Add Order` (unchanged — the two crumbs the shipped page renders;
  keys `home.label` and `breadcrumb.label.addOrder`)
- **URL route:** `` `/SamplePatientEntry` `` (unchanged — the existing Add Order route)

The same sample section appears on **Edit Order** for adding samples to an already-placed order.

---

## User Stories

- **As a person collecting samples at reception,** I want to add a second and third sample of the
  same type to an order in one click, so that I am not re-typing the same twelve fields for each
  container.
- **As a person collecting samples,** I want to write a short description on each sample ("0700
  void", "morning", "day 2"), so that the laboratory can tell three identical-looking containers
  apart.
- **As a laboratory technician entering results,** I want to see which specimen each result
  belongs to, so that I record the smear grade against the specimen I actually examined.
- **As a clinician reading the report,** I want the results from a multi-specimen study to appear
  together under one lab number with each specimen identified, so that I can see that specimen 2
  was positive and specimens 1 and 3 were not.
- **As a person collecting samples,** I want to add a further sample to an order that is already
  placed, so that an unplanned fourth collection does not require a whole new order.

---

## Functional Requirements

### Sample groups and adding samples

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | A sample block on Add Order represents a **sample group**: one sample type, one selection of tests and panels, one storage location, and one or more numbered samples. | The current sample block is a group containing exactly one sample. |
| FR-2 | A new order opens with one sample group containing exactly **one** sample, with no sample type and no tests selected. | Unchanged default behaviour; no configuration sets a different starting count. |
| FR-3 | An **Add another sample** action inside a sample group appends a new numbered sample to that group. The new sample inherits the group's sample type, tests, and panels without re-selection. | The primary interaction this specification exists to deliver. |
| FR-4 | A newly added sample pre-fills its collection date, collector, quantity, unit, collection method, sample temperature, and specimen origin from the sample above it. All pre-filled values remain editable. | Reduces re-entry to the fields that genuinely differ. Composes with the existing `AUTOFILL_COLLECTION_DATE` order-entry setting — see Dependencies. |
| FR-5 | A newly added sample leaves **collection time** and **description** blank. | These are the two fields that differ between collections; pre-filling them invites a wrong value being accepted unchanged. |
| FR-6 | There is no configured minimum or maximum number of samples in a group. | Per product direction: the collector knows how many there are. |
| FR-7 | When a group reaches 20 samples, an inline warning appears. Adding further samples is still permitted. | A guard against runaway input, not a limit. |
| FR-8 | The existing **Add Sample** action continues to add a new, empty sample group with its own sample type. The two actions are visually distinct: adding a group is a primary action below the groups; adding a sample is a secondary action inside a group. | Both are needed — one order can have three urines and one blood. |

### Identifying an individual sample

| ID | Requirement | Notes |
|---|---|---|
| FR-9 | Each sample displays its **sort order within the order** and the count of non-voided samples in its group, as **Sample _n_ of _N_**. `n` is the sample's own permanent number; `N` is a count, not an index. | See FR-35 — `n` is the same number that appears on the label and in the accession number. |
| FR-10 | Each sample has an optional free-text **Description** of up to 60 characters. | A new data element — see Dependencies. |
| FR-11 | Each sample has its own collection date, collection time, and collector, independently editable. | All three already exist per sample. |
| FR-12 | Each sample retains its own quantity, unit of measure, collection method, sample temperature, specimen origin, rejection state, and rejection reason. | All already exist per sample; this requirement states that they are per-sample and not per-group. Storage location is **not** in this list — see FR-37. |
| FR-13 | A sample with no description is identified by its number alone. Description is never required. | |
| FR-14 | If two samples in the same group carry the same non-empty description, an inline warning is shown. Saving is not blocked. | Duplicate descriptions are usually a mistake but occasionally legitimate. |
| FR-15 | Samples within a group are **peers**. No sample is derived from, or a portion of, another. | Explicitly distinct from aliquoting — see Dependencies. |
| FR-36 | Each sample row shows, without expanding: its position, description, collection date, collection time, and collector. Quantity, unit of measure, collection method, sample temperature, specimen origin, and the rejection state and reason are in the row's expanded panel. | The row header holds the fields that differ between sibling collections; the panel holds the fields that are usually inherited unchanged. |
| FR-37 | Storage location is chosen **once per sample group** and applies to every sample in that group. It is not editable per sample. | Sibling collections of one study are stored together. Requires a small backend change — see Dependencies. |

### Numbering, labels, and identity in the laboratory

| ID | Requirement | Notes |
|---|---|---|
| FR-16 | Each sample receives its own sample identifier under the order's lab number, following the numbering scheme already in use for multiple samples on one order (the lab number suffixed with the sample's sort order, e.g. `26-004077-3`). | No new numbering scheme is introduced. |
| FR-35 | The position shown to users in **Sample _n_ of _N_** is the same number as the suffix on the sample's label and accession number. A user reading `26-004077-3` off a tube finds it on screen as "Sample 3 of …". | There is exactly one number per specimen. Two competing numbers would defeat the purpose of the feature. |
| FR-17 | The Labels section lists one specimen-label row per non-voided sample in the group, each row identified by the sample's number and description. Label quantities are set per sample. | Extends the existing per-sample label row behaviour; requires a new data element — see Dependencies. |
| FR-18 | The printed specimen label shows the sample's position (for example "2 of 3") and its description when one is present. | |

### Results

| ID | Requirement | Notes |
|---|---|---|
| FR-19 | Each test selected on a group produces **one result per sample** in that group. A group of three samples with two tests selected produces six results. | Matches how results already attach to an individual sample. |
| FR-20 | Wherever a sample is already identified — result entry, validation, worklists, and the patient report — it is shown as its position within the group plus its description when present. | Display change only; no new screens. Must be harmonised with the existing aliquot identity shown on the same screens — see Dependencies. |
| FR-21 | The patient report groups the results of one sample group together under the order's lab number, with each sample identified. | So a clinician can see which specimen was positive. |

### Adding and removing after the order is placed

| ID | Requirement | Notes |
|---|---|---|
| FR-22 | A sample may be added to a group at any time until every result on the order has been validated. | Per product direction. |
| FR-23 | Adding a sample to a placed order creates results for that sample for every test already on the group, in the same not-started state a newly ordered test has. | |
| FR-24 | A sample added after the order was placed is flagged as such in the order view. | Makes an unplanned fourth collection visible rather than silently backdated. Requires a new data element — see Dependencies. |
| FR-25 | Before the order is saved, a sample may be removed from the form outright. | Nothing has been recorded yet. |
| FR-26 | After the order is saved, a sample is **not deleted**. It is voided with a reason, using the void treatment already recorded against a sample. | Preserves the record for audit and accreditation. |
| FR-27 | A voided sample keeps its number permanently. Siblings are **never** renumbered — not when a sample is voided, and not when one is added. `N` in "Sample _n_ of _N_" counts only non-voided samples, so voiding sample 2 of a group of 3 leaves the remaining samples displayed as "Sample 1 of 2" and "Sample 3 of 2". | Renumbering after the fact would break labels already printed, accession suffixes already assigned, and results already recorded. The count and the position are deliberately allowed to disagree; the position is the identity. |
| FR-28 | Voiding a sample cancels its not-started results. A sample with any validated result cannot be voided; the action is disabled with a visible explanation. | |
| FR-29 | Removing the only remaining sample in a group removes the group. | |
| FR-30 | Adding a sample to a placed order, and voiding a sample, are both recorded in the order's audit trail. | Uses the existing audit trail. |

### Empty, loading, and error states

| ID | Requirement | Notes |
|---|---|---|
| FR-31 | Changing a group's sample type when the group holds more than one sample requires confirmation, and clears the group's test and panel selection as it does today. The sample rows and their collection details are kept. | Collection details are not sample-type-specific. |
| FR-32 | While the tests for a newly chosen sample type are loading, the group shows a loading state and the **Add another sample** action is disabled. | |
| FR-33 | A group with no test or panel selected cannot be saved, regardless of how many samples it holds. | Unchanged from today. |
| FR-34 | If saving an order fails, the full set of samples and their per-sample values is preserved in the form. | |

---

## Information & Data

Named once, so the rest of this document can use plain words: what a user calls an **order** is
the `Sample` record (it carries the lab number / accession number); what a user calls a
**sample** or **specimen** — the individual tube, cup or slide — is a `SampleItem`. Everywhere
below, "order" means the former and "sample" means the latter.

An order carries one or more samples. Each sample records what kind of material it is, when and
by whom it was collected, how much of it there is, how it was collected and transported, whether
it was rejected or voided, and where it sits in the collection sequence for the order.

A **sample group** is not a new record. It is the set of samples on one order that share a sample
type — the grouping the Add Order page displays and that the laboratory thinks in. Tests attach
to an individual sample, so on re-opening an order the group and its test selection reconstruct
from the samples themselves.

Attributes used, all of which OpenELIS already records per sample:

| Information | Notes |
|---|---|
| Sample type | Which material — urine, sputum, stool, blood |
| Sort order within the order | Already recorded, already drives per-sample ordering, and already forms the accession suffix (`26-004077-3`) |
| Collection date and time | Already per sample |
| Collector | Already per sample |
| Quantity and unit of measure | Already per sample |
| Collection method | Already per sample |
| Sample temperature | Already per sample |
| Specimen origin | Already per sample |
| Rejected, rejection reason | Already per sample |
| Voided, void reason | Already per sample |
| External identifier | Already per sample |

Three attributes do **not** exist today and are declared in Dependencies: the free-text
**description** of an individual sample, the **added-after-placement** flag, and the **per-sample
specimen-label quantity**. Storage location is recorded per group rather than per sample, and the
way it is applied also needs a change — see Dependencies.

### Lifecycle of a sample

`entered` → `collected / received` → results recorded → validated. A sample may be **rejected**
at receipt (existing behaviour) or **voided** after the order is placed (FR-26). Voided is
terminal and does not renumber siblings.

### Uniqueness

A sample's number is unique within its order and permanent once assigned; it is not reused and
not made gapless after a void. Descriptions are not required to be unique; duplicates within a
group raise a warning only (FR-14).

---

## Access

**Accessible via the existing roles that can reach Add Order and Edit Order today** — Reception
and Admin. No new role and no new permission is introduced.

| Action | Who can do it | What everyone else sees |
|---|---|---|
| Add a sample to a group while placing an order | Reception, Admin | The Add Order page is not available to them at all |
| Add a sample to a group on a placed order | Reception, Admin | The **Add another sample** action is not shown |
| Edit a sample's description, collection time, or collector | Reception, Admin | Fields are read-only |
| Void a sample on a placed order | Reception, Admin, while no result on that sample has been validated | The **Void sample** action is not shown |
| See sample number and description at result entry, validation, and on the report | Analyst, Validator, Provider — everyone who can already see the sample | — |

A user without the capability to change an order sees the samples, their numbers, and their
descriptions as read-only text; the add and void actions are hidden rather than disabled.

---

## Localization

Every visible string carries an i18n key. Reused keys below were verified against
`frontend/src/languages/en.json` on `develop`; the English column is the key's actual value in
that file. Anything without an existing key is in the **New** table.

### Reused — verified present in `en.json`

| UI text | Key | Status |
|---|---|---|
| Home | `home.label` | REUSE — breadcrumb root |
| Add Order | `breadcrumb.label.addOrder` | REUSE — breadcrumb leaf and page title |
| Sample | `label.button.sample` | REUSE — group heading |
| Add Sample | `sample.add.action` | REUSE — the outer action, adds a group |
| Remove Sample | `sample.remove.action` | REUSE — removes a whole group |
| Sample Type | `field.sampleType` | REUSE |
| Select sample type | `sample.select.type` | REUSE |
| Collection Date | `sample.collection.date` | REUSE |
| Collection Time | `sample.collection.time` | REUSE |
| Collector | `collector.label` | REUSE |
| Quantity | `sample.quantity.label` | REUSE |
| Sample Unit Of Measure | `sample.uom.label` | REUSE |
| Collection Method | `sample.collection.method` | REUSE |
| Sample Temperature | `sample.temperature` | REUSE |
| Specimen Origin (referent lab) | `sample.specimen.origin` | REUSE |
| Reject Sample | `sample.reject.label` | REUSE |
| Storage Location | `storage.location.label` | REUSE — group-level picker heading |
| Select {level} | `storage.picker.select` | REUSE — one per hierarchy level (room, device, shelf, rack, box) |
| Position (optional) | `storage.picker.position.optional` | REUSE |
| Label quantities | `barcode.labels.section.title` | REUSE — labels section heading |
| Order labels | `barcode.labels.order.row` | REUSE — the order-label row |
| Running total | `barcode.labels.running.total` | REUSE |
| Remove | `label.button.remove` | REUSE |
| Cancel | `label.button.cancel` | REUSE |
| Confirm | `label.confirm` | REUSE |
| Warning | `label.warning` | REUSE |
| Expand row | `label.results.expandRow` | REUSE — per-sample detail disclosure |
| Collapse row | `label.results.collapseRow` | REUSE — per-sample detail disclosure |
| Lab Number | `eorder.labNumber` | REUSE — downstream views |
| Sample | `label.results.sample` | REUSE — downstream views |
| Test | `label.results.test` | REUSE — downstream views |
| Result | `label.results.result` | REUSE — downstream views |
| Status | `label.results.status` | REUSE — downstream views |

> `barcode.labels.sample.row` (`"Specimen labels sample {sampleNumber}"`) is **not** reused. It
> carries a single placeholder and cannot express position, total, and description without
> concatenating untranslatable glue text around it. A replacement key is declared below.

### New

| UI text | Key | Context |
|---|---|---|
| Samples | `order.sample.group.samplesHeading` | Heading above the sample rows in a group |
| Tests & Panels | `order.sample.group.testsAndPanels` | Combined heading; not two keys joined by an ampersand |
| Description | `order.sample.description.label` | Per-sample description field label |
| Add another sample | `order.sample.addAnother` | Secondary action inside a group |
| Sample {position} of {total} | `order.sample.positionOfTotal` | Row header. ICU placeholders; no plural syntax. |
| e.g. 0700 void, spot, day 2 | `order.sample.description.placeholder` | Description field placeholder |
| Optional. Helps the lab tell this sample apart from the others in this group. | `order.sample.description.helper` | Description field helper text |
| {count} samples | `order.sample.group.count` | Tag on the group header. ICU placeholder; no plural syntax. |
| Collection details were copied from the previous sample. Set the time and description for this collection. | `order.sample.inherited.helper` | Shown once on a newly added sample |
| Two samples in this group have the same description. | `order.sample.duplicateDescription.warning` | Inline warning, non-blocking |
| This group already has {count} samples. Add more only if the collection requires it. | `order.sample.countGuard.warning` | Inline warning at 20 samples |
| Loading tests for this sample type… | `order.sample.loadingTests` | FR-32 loading state |
| Choose a rejection reason | `order.sample.rejectionReason.label` | Reason select, shown when a sample is rejected |
| Storage applies to every sample in this group. | `order.sample.storage.groupHelper` | Helper under the group-level storage picker |
| Sample {position} of {total} — {description} | `order.sample.label.specimenRow` | Replaces `barcode.labels.sample.row` for multi-sample groups. Three placeholders so the row reads correctly in any locale; the whole sentence including the separator lives inside the key. Also used to name a sample on the downstream screens (FR-20). |
| No description | `order.sample.label.noDescription` | Substituted into `{description}` when a sample has none |
| Void sample | `order.sample.void.action` | Action on a placed order |
| Void sample | `order.sample.void.modalTitle` | Confirmation modal heading |
| Reason for voiding | `order.sample.void.reason` | Void confirmation field |
| Voiding cancels the tests still pending on this sample. The sample stays on the order for the record. | `order.sample.void.explanation` | Void confirmation body |
| This sample has validated results and cannot be voided. | `order.sample.void.blocked` | Explanation shown beside the disabled action |
| Voided | `order.sample.void.tag` | Status tag on a voided sample |
| Voided — {reason}. Pending tests on this sample were cancelled. | `order.sample.void.summary` | Shown in the expanded panel of a voided sample |
| Added after order placed | `order.sample.addedLater.tag` | Status tag |
| Changing the sample type will clear the tests selected for this group. The samples and their collection details are kept. | `order.sample.changeType.confirm` | Confirmation body |
| Change sample type | `order.sample.changeType.modalTitle` | Confirmation modal heading |
| Selected once for the group — every sample above is tested for each of these. | `order.sample.group.testsHelper` | Helper under the group's test chips |
| {samples} samples × {tests} tests = {results} results | `order.sample.group.resultCount` | Running tally under the test chips |

---

## Dependencies

### New data elements

1. **Sample description.** A free-text description of up to 60 characters, recorded against an
   individual sample. No equivalent attribute exists today.

2. **Added-after-placement flag.** FR-24 requires a sample added to an already-placed order to be
   visibly flagged as such, permanently. This is a genuinely new attribute on the sample. It is
   **not** derivable from anything recorded today — the sample's last-updated timestamp is
   rewritten on every subsequent edit and cannot establish when the sample first appeared.

3. **Per-sample specimen-label quantity.** FR-17 requires each sample in a group to carry its own
   specimen-label count. Today a sample block carries a single label count covering the block.
   This new per-sample quantity **must land inside the OGC-285 labels model**, not alongside it —
   the labels section is being reworked under that ticket, and a second parallel label-quantity
   model would have to be unpicked later.

### Required change to existing behaviour

4. **Storage location must apply to every sample in a group.** FR-37 keeps storage at group level,
   so no new data element is needed — but the shipped pipeline applies a sample block's storage
   selection to the **first** sample only. Applying it to every sample created from the block is a
   small, required backend change. The user-facing picker stays as it is today: the existing
   hierarchical location picker (room → device → shelf → rack → box, plus an optional position),
   shown once per group.

5. **Specimen label row wording.** The existing label-row key carries only a sample number. A
   replacement with position, total, and description placeholders is declared in Localization;
   it belongs in the OGC-285 labels model alongside dependency 3.

### Coordination with other work

6. **Aliquoting — do not use the sample derivation relationship, and harmonise the display.**
   OpenELIS already records a parent/child relationship between samples for **aliquoting** —
   dividing one collected sample into portions, with volume decremented from the parent. Sibling
   collections are not aliquots: they are independent collections from the patient, each with its
   own volume and its own collection time. Implementations must leave the derivation relationship
   unset for these samples. Separately, the shipped aliquots feature **already displays a
   per-sample identity at result entry** (each aliquot's own lab number). FR-20 adds a second
   per-sample identity to the same screen. The two must be designed to sit together rather than
   compete; this is a display decision that should be made once, not per screen.

7. **Env/Vector order entry (OGC-527).** That work owns the order-entry wizard, the order and
   sample entities, and the aliquot numbering convention `LABNO.X-Y` — the same page, the same
   entities, and the same numbering namespace this specification extends. The two must agree on
   one numbering and one per-sample identity display before either ships.

8. **Order & Patient Entry configuration.** The existing order-entry settings, in particular
   `AUTOFILL_COLLECTION_DATE`, already govern whether collection date and time are pre-filled on a
   new sample block. FR-4's inheritance rule composes with that setting rather than replacing it:
   inheritance from the previous sample takes precedence where a previous sample exists, and the
   autofill behaviour is unchanged for the first sample in a group.

9. **Downstream display, four screens.** Result entry, validation, worklists, and the patient
   report each already identify a sample; each needs to render its position and description
   (FR-20, FR-21). This is display-only, but it spans four surfaces and should be coordinated
   rather than left to each screen.

### Defects and limitations

10. **Defect to fix as part of this work.** The existing sample-removal handler passed into the
    sample form assigns the return value of an array splice to state, which replaces the sample
    list with only the removed element rather than removing it from the list. It is currently
    masked because the visible remove link uses a different handler, but this work makes removal a
    first-class per-sample action and will expose it.

11. **Known limitation, declared not built.** Because a sample group is reconstructed from the
    samples themselves, two groups of the *same* sample type with *different* test selections merge
    into a single group when the order is re-opened. Each sample keeps only the tests actually
    ordered on it, so no result is lost or invented. If a laboratory needs two independently
    scoped groups of the same sample type to survive re-opening, that requires a group identifier
    recorded against each sample — declared here, not proposed for this version.

12. **Not required.** No change to the test catalog, no change to how a test is associated with a
    sample type, no new numbering scheme, no new role.

---

## Out of Scope

- **Pooled and composite collections.** A 24-hour urine arriving in four containers, or a
  composite environmental sample, is mixed and tested as one specimen with one result. That is a
  different model — several collections producing one tested sample — and is deliberately excluded
  from this version. It is a known gap, not an oversight; the relevant standards model it
  explicitly (a specimen marked as pooled, derived from its source collections) and it can be
  added later without disturbing anything specified here.
- **Configuring an expected sample count per test in the test catalog.** The count is a collection
  time decision.
- **Aliquoting.** Already exists and is a different concept (see Dependencies).
- **Per-sample storage location.** Storage is set once per group (FR-37).
- **Any change to how a test is associated with a sample type.** A test still belongs to exactly
  one sample type.
- **Scheduling or reminders for timed collections.** OpenELIS records the collection times it is
  given; it does not prompt for the next one.
- **Calculated results across samples** — a mean, a total, or a ratio derived from several samples
  in a group.
- **Automatic renumbering after voiding.** Explicitly excluded by FR-27.

---

## Acceptance Criteria

- [ ] A sample group with a sample type and tests selected shows an **Add another sample** action.
- [ ] Clicking it appends a numbered sample that requires no sample type or test re-selection.
- [ ] The appended sample pre-fills collection date, collector, quantity, unit, collection method,
      temperature, and specimen origin from the sample above it, and leaves time and description blank.
- [ ] Each sample can be given a description of up to 60 characters; the field is optional.
- [ ] Each sample can be given its own collection date, time, and collector, and changing one does
      not change another.
- [ ] A sample row shows position, description, collection date, collection time, and collector
      without expanding; quantity, unit, collection method, temperature, specimen origin, and
      rejection are in the expanded panel.
- [ ] Storage location is chosen once per group and cannot be set per sample, and the chosen
      location is applied to every sample in the group on save.
- [ ] Checking "reject" on a sample reveals a rejection-reason select for that sample.
- [ ] Two samples in a group with the same non-empty description produce a warning and still save.
- [ ] A group of three samples with two tests selected produces six results on save.
- [ ] Each result is attributable to exactly one sample, identified by position and description.
- [ ] The number shown as the sample's position is the same number that appears as the suffix on
      its label and accession number.
- [ ] The Labels section shows one specimen row per non-voided sample, each identified by position
      and description.
- [ ] A printed specimen label shows the sample's position and its description when present.
- [ ] A sample can be added to an order that has already been placed, and receives results for
      every test already on the group.
- [ ] A sample added after the order was placed is visibly flagged as such.
- [ ] A saved sample offers **Void sample**, not Delete.
- [ ] Voiding a sample opens a confirmation that captures a reason before the sample is voided.
- [ ] Voiding a sample cancels its pending results and leaves every other sample's number unchanged.
- [ ] After a void, the remaining samples' displayed totals drop by one while their positions stay
      as they were.
- [ ] A sample with any validated result has the void action disabled, with a visible explanation
      (not a hover-only tooltip).
- [ ] Changing a group's sample type prompts for confirmation and keeps the sample rows.
- [ ] While tests for a newly chosen sample type load, the group shows a loading state and
      **Add another sample** is disabled.
- [ ] Adding a sample after placement, and voiding a sample, both appear in the order's audit trail.
- [ ] Every string listed in the Localization table resolves from an i18n key that exists in
      `en.json`, or is delivered as part of this work; none is hardcoded.
- [ ] Samples in a group have no derivation relationship set between them.

---

## Design Governance Check

| Check | Result |
|---|---|
| Reuses existing data; new data declared (MUST A / D-009) | Three new attributes — sample description, added-after-placement flag, per-sample specimen-label quantity — declared in Dependencies, plus one required change to how the existing storage selection is applied. Everything else already exists per sample. |
| No multitenancy (MUST B / D-001) | No site, lab, or tenant selector anywhere in this feature. "Specimen origin (referent lab)" is an existing free-text field, not a cross-organisation view. |
| Shipped app is the style and route source (MUST C / D-008) | Extends the shipped `/SamplePatientEntry` page; no new route. Breadcrumb matches the two crumbs the shipped page renders. Localization keys verified against `en.json` on `develop`. |
| No hard delete (MUST D / D-002) | FR-26: saved samples are voided with a reason, never deleted. Pre-save form rows may be removed because nothing has been recorded. |
| Designed for large catalogs (MUST E / D-007) | No new picker introduced; the sample type and test selectors are unchanged, and storage uses the existing hierarchical picker rather than a flat list. |
| Specimen-is-identity preserved (D-028) | Untouched. A test still maps to exactly one sample type; this adds sample *instances*, not sample *types*, per test. |
| Selected items show labels, not counts | Sample rows show number **and** description; the group count tag accompanies the visible rows rather than replacing them. |
| Inline expansion, not modals (D-005) | Per-sample detail expands inline in the row. Modals are used only for the two destructive confirmations: voiding a sample, and changing a group's sample type (which clears the test selection). |

---

## Note for the JSX mockup

The HTML preview is a review artifact and approximates Carbon with plain markup. The JSX mockup
built at handoff must not: it uses `@carbon/react` components only — `Grid`/`Column` for layout
(no raw CSS grid), `DataTable` with inline row expansion for the sample rows and the label rows,
Carbon `Tag` for every status including **Voided**, Carbon `Modal` for the void and change-type
confirmations, `Select`/`ComboBox` for pickers, and Carbon spacing and colour tokens throughout —
no hardcoded hex values and no magic pixel spacing.
