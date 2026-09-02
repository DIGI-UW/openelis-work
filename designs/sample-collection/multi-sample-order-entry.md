# Multiple Samples per Test at Order Entry — Functional Requirements Specification

**Version:** 1.4
**Date:** 2026-08-13
**Author:** OpenELIS Global product design
**Status:** Draft for review
**Affects:** Add Order (`/SamplePatientEntry`), Edit Order, specimen labels, result entry display

**Changelog**

- **1.4 (2026-08-13)** — Preview fidelity. Establishes the standing rule that anything already in the
  shipped app is either reproduced exactly or stubbed as a muted placeholder, never redrawn from
  imagination. Test and panel selection now reproduces the shipped `SampleType.jsx` pattern exactly
  (filter tags, two Carbon `Search` fields, the click-to-select match list, the no-match tile, and the
  full checkbox lists). The storage picker and the labels section are shown as muted placeholders for
  the existing components rather than drawn. The labels model is corrected in wording: the existing
  section is one box listing every label that will print, and this feature's only change to it is that
  it gains a row per sample. The description field — which carries the whole point of the feature — is
  now by far the widest field in the sample row.
- **1.3 (2026-08-13)** — Labels corrected against the shipped OGC-285 M5 implementation. **A declared
  new data element was retired**: per-sample specimen-label quantity is not new — `LabelsSection`'s
  API-driven mode already returns `sample_rows[]`, one entry per sample, each with a `cells[]` array
  carrying resolved default, maximum, locked state and source attribution. The new-data-element count
  drops from three to two (description, added-after-placement flag). Also corrected: the Add Order
  page **already runs the API-driven mode** at order level, so this feature adopts and re-points an
  existing integration rather than migrating one. The labels row header now goes through the
  component's `sampleLabelFormatter` prop. Invented label keys removed in favour of the eleven real
  `orderEntry.labels.*` keys. Two constraints in the shipped contract that this feature must work
  around are recorded in Dependencies.
- **1.2 (2026-08-13)** — Usability round from design critique. The two add actions renamed and
  re-weighted so they cannot be confused ("Add another urine sample" inside a group, "Add a
  different sample type" outside it). "Sample _n_ of _N_" split apart: rows show only the permanent
  number, and the count lives solely in the group header — this removes the "Sample 3 of 2" reading
  that FR-27 previously produced. Inheritance made safe and visible: the collection date is not
  inherited from a sample collected on an earlier day, and copied values stay marked as copied until
  edited. Two groups of the same sample type on one order are now prevented outright, which
  **designs out** the reload-merge limitation that v1.1 deferred — the group-identifier dependency
  is deleted rather than carried. Pre-save and post-save removal now share the word "Remove", with
  the difference explained in the confirmation. Adding a sample to a placed order confirms what it
  will create. Rejection surfaced into the row header. Group-level storage recorded as an accepted
  limitation.
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
another urine sample** twice. Three numbered rows appear inside the same urine block. Each row carries
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
collections. It adds two new pieces of information to a sample (see Dependencies), reuses everything
else that OpenELIS already records per sample — including the existing per-sample label aggregation —
and reorganises the Add Order samples section so that adding a second collection of the same kind
takes one click instead of a dozen fields.

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
| FR-3 | An **Add another {sampleType} sample** action inside a sample group appends a new numbered sample to that group — for a urine group it reads "Add another urine sample". The new sample inherits the group's sample type, tests, and panels without re-selection. | The primary interaction this specification exists to deliver, so it is the prominent action inside the group. Naming the sample type in the label is what keeps it from being confused with FR-8. |
| FR-4 | A newly added sample pre-fills its collector, quantity, unit, collection method, sample temperature, and specimen origin from the sample above it. It pre-fills the **collection date** only when the sample above it was collected **today**; otherwise the date is left blank. All pre-filled values remain editable. | Reduces re-entry to the fields that genuinely differ. The date condition matters because sibling collections routinely span days (a spot specimen and the next morning's), and a silently inherited stale date is a wrong value nobody has to touch to accept. Composes with the existing `AUTOFILL_COLLECTION_DATE` order-entry setting — see Dependencies. |
| FR-5 | A newly added sample leaves **collection time** and **description** blank. | These are the two fields that differ between collections; pre-filling them invites a wrong value being accepted unchanged. |
| FR-6 | There is no configured minimum or maximum number of samples in a group. | Per product direction: the collector knows how many there are. |
| FR-7 | When a group reaches 20 samples, an inline warning appears. Adding further samples is still permitted. | A guard against runaway input, not a limit. |
| FR-8 | An **Add a different sample type** action below the groups adds a new, empty sample group. It is a secondary action; the per-group action in FR-3 is the prominent one. | Both are needed — one order can have three urines and one blood — but adding a sibling is the common case and adding a second type is not. The old label "Add Sample" is retired here because it was indistinguishable from FR-3's action. |
| FR-38 | A value copied into a sample by FR-4 is visibly marked as copied. The mark on a field clears when **that field** is edited, and is unaffected by edits to any other field on the sample or elsewhere in the group. It is not a transient message. | The collector needs to be able to tell, at any point before saving, which values they actually confirmed and which were carried over — including after they have already edited something else on the row. |

### Identifying an individual sample

| ID | Requirement | Notes |
|---|---|---|
| FR-9 | Each sample displays its **sort order within the order** alone, as **Sample _n_**. The count of samples in the group is shown once, on the group header, and nowhere else. | The two numbers are deliberately not shown together. Combining them produced readings like "Sample 3 of 2" after a removal (FR-27), which every reviewer read as a defect. See FR-35 — `n` is the same number that appears on the label and in the accession number. |
| FR-10 | Each sample has an optional free-text **Description** of up to 60 characters. | A new data element — see Dependencies. |
| FR-11 | Each sample has its own collection date, collection time, and collector, independently editable. | All three already exist per sample. |
| FR-12 | Each sample retains its own quantity, unit of measure, collection method, sample temperature, specimen origin, rejection state, and rejection reason. | All already exist per sample; this requirement states that they are per-sample and not per-group. Storage location is **not** in this list — see FR-37. |
| FR-13 | A sample with no description is identified by its number alone. Description is never required. | |
| FR-14 | If two samples in the same group carry the same non-empty description, an inline warning is shown. Saving is not blocked. | Duplicate descriptions are usually a mistake but occasionally legitimate. |
| FR-15 | Samples within a group are **peers**. No sample is derived from, or a portion of, another. | Explicitly distinct from aliquoting — see Dependencies. |
| FR-36 | Each sample row shows, without expanding: its number, description, collection date, collection time, collector, and the **reject** control — with its reason selector appearing in the row as soon as reject is set. Quantity, unit of measure, collection method, sample temperature, and specimen origin are in the row's expanded panel. | The row header holds the fields that differ between sibling collections plus the one decision made at receipt; the panel holds the fields that are usually inherited unchanged. Rejection was previously two clicks deep, which is wrong for something done routinely and under time pressure. |
| FR-37 | Storage location is chosen **once per sample group**, using the **existing storage location picker unchanged**, and applies to every sample in that group. It is not editable per sample. | Sibling collections of one study are stored together. The picker itself is untouched — only its placement (once per group) is this feature's concern, so the HTML preview stubs it as a muted placeholder. Requires a small backend change — see Dependencies. Accepted limitation — see Out of Scope. |
| FR-42 | The **Description** field is the widest field in the sample row, visibly wider than any other, and remains limited to 60 characters. | It carries the entire point of the feature — telling three identical containers apart — and must not be sized like an incidental field. If the row becomes crowded, fields move into the expanded panel rather than description being narrowed. |
| FR-43 | Test and panel selection is the **existing** Add Order control, unchanged: removable filter tags for the current selection, a search for panels and a search for tests, a click-to-select list of matches while a term is present, a no-match message showing the term, and the full checkbox list of everything available for the chosen sample type. The sample type control remains a plain select. | This feature changes *where* the selection applies (once per group, inherited by every sample in it), not *how* it is made. No new picker is introduced. |
| FR-39 | A sample type may appear on an order **at most once**. If the user chooses a sample type that already has a group on this order, no second group is created. | One group per sample type per order is an invariant, not a convention. |
| FR-40 | When FR-39 is triggered, the user is told that a group of that type already exists and is offered the option of adding another sample to the existing group instead. Accepting adds a sample to the existing group and brings it into view. Declining discards the new group and leaves the order unchanged. | Turns a dead end into the action the user almost certainly wanted. |

### Numbering, labels, and identity in the laboratory

| ID | Requirement | Notes |
|---|---|---|
| FR-16 | Each sample receives its own sample identifier under the order's lab number, following the numbering scheme already in use for multiple samples on one order (the lab number suffixed with the sample's sort order, e.g. `26-004077-3`). | No new numbering scheme is introduced. |
| FR-35 | The number shown to users as **Sample _n_** is the same number as the suffix on the sample's label and accession number. A user reading `26-004077-3` off a tube finds it on screen as "Sample 3". | There is exactly one number per specimen. Two competing numbers would defeat the purpose of the feature. |
| FR-17 | The **existing** Labels section — the single box listing every label that will print for this order — **gains one row per non-voided sample** in the group, each identified by the sample's number and description. Voided samples drop out of it. Nothing else about that section changes. | This feature does not build a labels UI. Per-sample rows, per-cell default quantities, maximums, locked cells and source attribution are all existing behaviour supplied by the label aggregation — see Dependencies. A group whose tests link to no per-sample preset legitimately yields no per-sample columns; that is the aggregation's behaviour, not a defect. The HTML preview intentionally **stubs** this section as a muted placeholder, because it is an existing component and redrawing it would invite it being rebuilt. |
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
| FR-41 | Adding a sample to a placed order is confirmed first, and the confirmation names how many tests it will create and which ones — for example "This will add 2 pending tests for this sample: Urine Microscopy, Urine Protein." | The action silently spawns work in the laboratory's queue. The user should see what they are about to create before it exists, not discover it on a worklist. |
| FR-24 | A sample added after the order was placed is flagged as such in the order view. | Makes an unplanned fourth collection visible rather than silently backdated. Requires a new data element — see Dependencies. |
| FR-25 | Before the order is saved, the **Remove** action on a sample removes it from the form outright, with no confirmation. | Nothing has been recorded yet, so there is nothing to preserve and nothing to warn about. |
| FR-26 | After the order is saved, the **Remove** action on a sample does **not** delete it. It asks for a reason and then voids the sample, using the void treatment already recorded against a sample. The confirmation states that the sample and its record stay on the order and that its pending tests will be cancelled. | Preserves the record for audit and accreditation. The button says the same word in both states because the user's intent is the same — "take this sample off my order"; the difference in what the system does is explained at the moment it matters, in the confirmation, not encoded in a verb ("void") that means nothing to a collector. |
| FR-27 | A voided sample keeps its number permanently. Siblings are **never** renumbered — not when a sample is voided, and not when one is added. Removing sample 2 from a group of three therefore leaves the remaining samples displayed as "Sample 1" and "Sample 3", and the group header count drops to 2. | Renumbering after the fact would break labels already printed, accession suffixes already assigned, and results already recorded. Numbers are gapped on purpose. Because the number and the count are never rendered together (FR-9), the gap reads as what it is rather than as an error. |
| FR-28 | Removing a saved sample cancels its not-started results. A sample with any validated result cannot be removed; the action is disabled with a visible explanation. | |
| FR-29 | Removing the only remaining sample in a group removes the group. | |
| FR-30 | Adding a sample to a placed order, and voiding a sample, are both recorded in the order's audit trail. | Uses the existing audit trail. |

### Empty, loading, and error states

| ID | Requirement | Notes |
|---|---|---|
| FR-31 | Changing a group's sample type when the group holds more than one sample requires confirmation, and clears the group's test and panel selection as it does today. The sample rows and their collection details are kept. | Collection details are not sample-type-specific. |
| FR-32 | While the tests for a newly chosen sample type are loading, the group shows a loading state and the **Add another {sampleType} sample** action is disabled. | |
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

Because a sample type may appear on an order at most once (FR-39), that reconstruction is
unambiguous: every sample of a given type on an order belongs to the one group for that type. This
is an **invariant**, and it is what allows the group to be derived rather than stored.

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

Two attributes do **not** exist today and are declared in Dependencies: the free-text
**description** of an individual sample and the **added-after-placement** flag. Per-sample label
quantities are *not* among them — the shipped label aggregation already returns one row of label
cells per sample. Storage location is recorded per group rather than per sample, and the way it is
applied also needs a change — see Dependencies.

### Lifecycle of a sample

`entered` → `collected / received` → results recorded → validated. A sample may be **rejected**
at receipt (existing behaviour) or **voided** after the order is placed (FR-26). Voided is
terminal and does not renumber siblings.

### Uniqueness

A sample's number is unique within its order and permanent once assigned; it is not reused and
not made gapless after a void. A **sample type is unique within an order** — at most one group per
type (FR-39). Descriptions are not required to be unique; duplicates within a group raise a warning
only (FR-14).

---

## Access

**Accessible via the existing roles that can reach Add Order and Edit Order today** — Reception
and Admin. No new role and no new permission is introduced.

| Action | Who can do it | What everyone else sees |
|---|---|---|
| Add a sample to a group while placing an order | Reception, Admin | The Add Order page is not available to them at all |
| Add a sample to a group on a placed order | Reception, Admin | The **Add another {sampleType} sample** action is not shown |
| Edit a sample's description, collection time, or collector | Reception, Admin | Fields are read-only |
| Remove a sample from a placed order | Reception, Admin, while no result on that sample has been validated | The **Remove** action is not shown |
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
| Remove | `label.button.remove` | REUSE — the removal action on a sample, in both the pre-save and placed states (FR-25, FR-26) |
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
| Reject Sample | `sample.reject.label` | REUSE — in the row header (FR-36), not the expanded panel |
| Order Panels | `sample.label.orderpanel` | REUSE — panel picker heading (FR-43) |
| Search through the available panels | `sample.search.panel.legend.text` | REUSE — panel search legend |
| Search Available panel | `label.search.availablepanel` | REUSE — panel search label |
| Choose Available panel | `choose.availablepanel` | REUSE — panel search placeholder |
| No panel found matching | `sample.panel.search.error.msg` | REUSE — panel no-match message |
| Order Tests | `ordertests.title` | REUSE — test picker heading. See the note below: the shipped component hardcodes this string instead of using a key. |
| Search through the available tests | `legend.search.availabletests` | REUSE — test search legend |
| Search Available Tests | `label.search.available.targetest` | REUSE — test search label |
| Choose Available Test | `holder.choose.availabletest` | REUSE — test search placeholder |
| No test Found Matching | `title.notestfoundmatching` | REUSE — test no-match message |
| Storage Location | `storage.location.label` | REUSE — group-level picker heading |
| Select {level} | `storage.picker.select` | REUSE — one per hierarchy level (room, device, shelf, rack, box) |
| Position (optional) | `storage.picker.position.optional` | REUSE |
| LABELS | `orderEntry.labels.heading` | REUSE — the labels section heading on Add Order |
| Order Labels | `orderEntry.labels.orderTable.title` | REUSE — order-label table title |
| Sample Labels | `orderEntry.labels.sampleTable.title` | REUSE — sample-label table title |
| Row | `orderEntry.labels.col.row` | REUSE — order table's row-header column |
| Sample | `orderEntry.labels.col.sample` | REUSE — sample table's row-header column |
| Order | `orderEntry.labels.orderRow.header` | REUSE — the single order row's header cell |
| Sample {number} | `orderEntry.labels.sampleRow.header` | REUSE — the component's default row header. This feature overrides it via `sampleLabelFormatter` (see below), but it remains the fallback. |
| Sample {number} {column} quantity | `orderEntry.labels.input.sample` | REUSE — accessible name of each quantity input. Not overridable by a prop; see Dependencies 5b. |
| Total labels: {total} | `orderEntry.labels.total` | REUSE — live total |
| From test | `orderEntry.labels.source.test` | REUSE — source chip on a cell whose quantity came from a test's label configuration |
| Preset default | `orderEntry.labels.source.presetDefault` | REUSE — source chip on a cell using the preset's own default |
| {label} is locked by the test configuration and cannot be changed. | `orderEntry.labels.locked.tooltipFor` | REUSE — tooltip on a locked cell |
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

> **Existing i18n defect, worth fixing while in this file.** `SampleType.jsx` renders the test
> picker's heading as a hardcoded `<h4>Order Tests</h4>` with no key, and only when at least one test
> is already selected. Keys with exactly that English already exist (`ordertests.title`,
> `sample.orderTests`). This feature touches that block, so it should wire the heading to
> `ordertests.title` and render it unconditionally.

> None of the `barcode.labels.*` keys are reused. They belong to `LabelsSection`'s **legacy** mode —
> the path this feature leaves behind (Dependencies 4b). The eleven `orderEntry.labels.*` keys above
> are the API-driven mode's own vocabulary and are used as-is; the only row header this feature
> supplies is `order.sample.label.specimenRow`, injected via `sampleLabelFormatter`.

### New

| UI text | Key | Context |
|---|---|---|
| Samples | `order.sample.group.samplesHeading` | Heading above the sample rows in a group |
| Tests & Panels | `order.sample.group.testsAndPanels` | Combined heading; not two keys joined by an ampersand |
| Description | `order.sample.description.label` | Per-sample description field label |
| Add another {sampleType} sample | `order.sample.addAnotherOfType` | The prominent action inside a group (FR-3). One ICU placeholder, filled with the group's sample type — "Add another urine sample". |
| Remove this sample type | `order.sample.removeGroup` | Removes a whole group (FR-29 and the group-level control). Replaces `sample.remove.action` ("Remove Sample") in this context, which now reads as a near-duplicate of the per-sample **Remove** introduced by FR-25/FR-26. `sample.remove.action` is no longer referenced by this feature. |
| Add a different sample type | `order.sample.addDifferentType` | The secondary action below the groups (FR-8). Replaces `sample.add.action` in this context; that key's English ("Add Sample") is too close to FR-3's action to keep. `sample.add.action` is no longer referenced by this feature. |
| Sample {n} | `order.sample.position` | Row header. One ICU placeholder — the sample's permanent number. Replaces the retired `order.sample.positionOfTotal`; the count is never rendered beside the number (FR-9). |
| e.g. 0700 void, spot, day 2 | `order.sample.description.placeholder` | Description field placeholder |
| Optional. Helps the lab tell this sample apart from the others in this group. | `order.sample.description.helper` | Description field helper text |
| {count} samples | `order.sample.group.count` | Tag on the group header. ICU placeholder; no plural syntax. |
| Collection details were copied from the previous sample. Check them, and set the time and description for this collection. | `order.sample.inherited.helper` | Shown on a newly added sample |
| Copied | `order.sample.inherited.fieldTag` | Marker on each individual field whose value was copied by FR-4; clears when that field is edited (FR-38) |
| Copied from the previous sample — not yet checked | `order.sample.inherited.fieldTitle` | Accessible description behind the per-field Copied marker |
| Two samples in this group have the same description. | `order.sample.duplicateDescription.warning` | Inline warning, non-blocking |
| This group already has {count} samples. Add more only if the collection requires it. | `order.sample.countGuard.warning` | Inline warning at 20 samples |
| Loading tests for this sample type… | `order.sample.loadingTests` | FR-32 loading state |
| Choose a rejection reason | `order.sample.rejectionReason.label` | Reason select, shown when a sample is rejected |
| Storage applies to every sample in this group. | `order.sample.storage.groupHelper` | Helper under the group-level storage picker |
| Sample {position} — {description} | `order.sample.label.specimenRow` | The sample-label row header. Its formatted output is passed into `LabelsSection`'s **`sampleLabelFormatter`** prop, replacing that component's default `orderEntry.labels.sampleRow.header`. Two placeholders; the whole sentence including the separator lives inside the key. Also used to name a sample on the downstream screens (FR-20). Nothing here involves `barcode.labels.sample.row` or the legacy `specimenLabelFormatter` — those belong to the legacy path this feature leaves behind. |
| No description | `order.sample.label.noDescription` | Substituted into `{description}` when a sample has none |
| Remove sample | `order.sample.void.modalTitle` | Confirmation modal heading on a placed order. The action itself is labelled with the reused `label.button.remove` in both states (FR-25, FR-26). |
| Reason for removing | `order.sample.void.reason` | Removal confirmation field |
| The sample and its record stay on the order. Its pending tests are cancelled. | `order.sample.void.explanation` | Removal confirmation body — this is where the pre-save and placed-order behaviours are distinguished, not in the button label |
| This sample has validated results and cannot be removed. | `order.sample.void.blocked` | Explanation shown beside the disabled action |
| Voided | `order.sample.void.tag` | Status tag on a removed sample. Deliberately still "Voided" — the status the record carries is voided even though the action the user takes is called Remove. |
| Voided — {reason}. Pending tests on this sample were cancelled. | `order.sample.void.summary` | Shown in the expanded panel of a removed sample |
| This will add {count} pending tests for this sample: {tests} | `order.sample.addToPlaced.confirm` | FR-41 confirmation body when adding a sample to a placed order |
| Add sample to this order | `order.sample.addToPlaced.modalTitle` | FR-41 confirmation heading |
| This order already has a {sampleType} group. Add another sample to it instead? | `order.sample.sameType.confirm` | FR-40 prompt body |
| {sampleType} already on this order | `order.sample.sameType.modalTitle` | FR-40 prompt heading |
| Add another sample to it | `order.sample.sameType.accept` | FR-40 accept action |
| Added after order placed | `order.sample.addedLater.tag` | Status tag |
| Changing the sample type will clear the tests selected for this group. The samples and their collection details are kept. | `order.sample.changeType.confirm` | Confirmation body |
| Change sample type | `order.sample.changeType.modalTitle` | Confirmation modal heading |
| Selected once for the group — every sample above is tested for each of these. | `order.sample.group.testsHelper` | Helper under the group's test chips |
| {samples} samples × {tests} tests = {results} results | `order.sample.group.resultCount` | Running tally under the test chips |

> **Plural convention, unresolved project-wide.** Several `{count}` keys above read badly in English at
> a count of one ("1 samples", "This will add 1 pending tests"). These keys deliberately follow the
> existing project convention of no ICU `plural` syntax, which the shipped `order.sample.group.count`
> already shares. A project-wide decision on adopting ICU `plural` is **owed** and is not taken here.

---

## Dependencies

### New data elements

1. **Sample description.** A free-text description of up to 60 characters, recorded against an
   individual sample. No equivalent attribute exists today.

2. **Added-after-placement flag.** FR-24 requires a sample added to an already-placed order to be
   visibly flagged as such, permanently. This is a genuinely new attribute on the sample. It is
   **not** derivable from anything recorded today — the sample's last-updated timestamp is
   rewritten on every subsequent edit and cannot establish when the sample first appeared.

### Required change to existing behaviour

3. **Storage location must apply to every sample in a group.** FR-37 keeps storage at group level,
   so no new data element is needed — but the shipped pipeline applies a sample block's storage
   selection to the **first** sample only. Applying it to every sample created from the block is a
   small, required backend change. The user-facing picker stays as it is today: the existing
   hierarchical location picker (room → device → shelf → rack → box, plus an optional position),
   shown once per group.

4. **Labels: adopt the existing per-sample aggregation — nothing new to build.** An earlier draft of
   this specification declared a per-sample specimen-label quantity as a new data element. **That was
   wrong, and the declaration is withdrawn.** `frontend/src/components/barcodeWorkflow/LabelsSection.jsx`
   already ships an API-driven mode (OGC-285 M5) that does exactly what FR-17 needs:

   - `POST /api/orderEntry/labelRequest` returns `{ order_columns, sample_columns, order_row,
     sample_rows }` (controller `OrderEntryLabelRequestController`, service
     `OrderEntryLabelRequestServiceImpl`, DTO `OrderEntryLabelRequestResponse`).
   - **`sample_rows` is already a list — one entry per sample**, each with a `sample_id_local` and a
     `cells[]` array, one cell per applicable preset column.
   - Each cell already carries `default`, `max`, `locked`, `source` (`test` | `preset_default`) and
     `source_test_name`, rendered as a source `Tag` chip and a `Locked` icon with tooltip. That is the
     test-catalog label configuration already aggregating per sample.
   - `buildPersistPayload` already emits `sample_rows[].cells[]` keyed by `sample_id_local`, and
     `SamplePatientEntryRestController` already persists it via `persistLabelRequests`.

   **Correction to the earlier framing:** Add Order does not need migrating to this mode — it is
   *already on it*. `AddOrder.jsx` builds the request from the samples that carry tests, posts it,
   renders `<LabelsSection labelRequest=… sampleLabelFormatter=… />` at order level, and lifts the
   chosen quantities into the save body. What this feature actually needs is therefore smaller and
   different:

   a. **Re-point the row header.** Replace `AddOrder.jsx`'s `orderLabelSampleFormatter` — which
      currently renders the *sample type name* — so it renders this feature's number-and-description
      string instead. This is a prop (`sampleLabelFormatter`), so **no change to `LabelsSection`**.
   b. **Retire the duplicate legacy section.** `SampleType.jsx` still renders a *second*, legacy-mode
      `LabelsSection` inside every sample block (`specimenQuantities={[sampleXml?.numSpecimenLabels ?? 1]}`
      — a single-element array, which is what made per-sample counts look impossible; the component's
      own `createSampleRows` maps over an array, so the caller was the single-valued part, not the
      component). With the order-level API section carrying the per-sample rows, the in-block legacy
      section is redundant and should be removed rather than left to disagree with it.

5. **Two constraints in the shipped labels contract that this feature must work around.** Both are
   real and neither is a blocker, but a developer who does not know about them will produce a subtly
   wrong screen:

   a. **`sample_id_local` is positional, not identity.** It is assigned client-side as `String(index)`
      over the *filtered* list of samples that carry tests, and the backend resolves it by list
      position over `getSampleItemsTests()`. It therefore renumbers whenever a sample drops out of
      that list — which is the exact opposite of FR-27, where the user-facing number never changes.
      These are two different numbers and must not be conflated: `sample_id_local` is a wire key for
      correlating a row to a `SampleItem` at save time; the number in FR-9/FR-35 is the sample's
      permanent identity. The formatter must resolve its sample by looking `sample_id_local` up in the
      same filtered list (as `AddOrder.jsx` already does) and must **not** use the row's
      `sampleNumber`, which is likewise just `index + 1`.
   b. **The quantity inputs' accessible names are not overridable.** Inside the component,
      `inputLabelFor` formats `orderEntry.labels.input.sample` ("Sample {number} {column} quantity")
      from that same positional `sampleNumber`, and it is *not* exposed as a prop. So a row whose
      visible header reads "Sample 3 — morning day 2" will have inputs announced as "Sample 2 …" to a
      screen-reader user. Fixing this needs a small change to `LabelsSection` — either make
      `inputLabelFor` injectable or have it reuse `sampleLabelFormatter`. **This is the one place the
      existing contract does not stretch to what this feature needs.**

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

11. **Not required.** No change to the test catalog, no change to how a test is associated with a
    sample type, no new numbering scheme, no new role. In particular **no group identifier is
    needed**: v1.1 declared one as a deferred dependency to cope with two same-type groups merging
    when an order is re-opened. FR-39 and FR-40 make two same-type groups impossible, so the merge
    can no longer occur and the group stays safely derivable from the samples. The limitation was
    designed out, not deferred.

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
- **Per-sample storage location.** Storage is set once per group (FR-37). This is a known and
  accepted limitation, not an oversight: a laboratory that stores three timed urines in three
  different boxes cannot record that, and will have to note it outside OpenELIS. It is accepted for
  this version for two reasons — per-sample storage would be a further undeclared data element, and
  the shipped pipeline assigns exactly one storage location per sample block, so making it
  per-sample is a larger change than it appears. Revisit if labs report it.
- **Two groups of the same sample type on one order.** Prevented outright (FR-39, FR-40).
- **Any change to how a test is associated with a sample type.** A test still belongs to exactly
  one sample type.
- **Scheduling or reminders for timed collections.** OpenELIS records the collection times it is
  given; it does not prompt for the next one.
- **Calculated results across samples** — a mean, a total, or a ratio derived from several samples
  in a group.
- **Automatic renumbering after voiding.** Explicitly excluded by FR-27.

---

## Acceptance Criteria

- [ ] A sample group with a sample type selected shows an action naming that type — "Add another
      urine sample" — as the prominent action inside the group, and the action below the groups reads
      "Add a different sample type" and is secondary.
- [ ] Clicking the in-group action appends a numbered sample that requires no sample type or test re-selection.
- [ ] The appended sample pre-fills collector, quantity, unit, collection method, temperature, and
      specimen origin from the sample above it, and leaves time and description blank.
- [ ] The appended sample pre-fills the collection date only when the sample above it was collected
      today; when that sample's date is any earlier day, the new sample's date is blank.
- [ ] Every pre-filled value is marked as copied, and the mark on a field survives editing a
      different field on the same sample; editing the marked field itself clears its mark.
- [ ] Each sample can be given a description of up to 60 characters; the field is optional.
- [ ] Each sample can be given its own collection date, time, and collector, and changing one does
      not change another.
- [ ] A sample row shows its number, description, collection date, collection time, collector, and
      the reject control without expanding; quantity, unit, collection method, temperature, and
      specimen origin are in the expanded panel.
- [ ] A sample can be rejected, and its rejection reason chosen, without expanding the row.
- [ ] Storage location is chosen once per group and cannot be set per sample, and the chosen
      location is applied to every sample in the group on save.
- [ ] Checking "reject" on a sample reveals a rejection-reason select for that sample in the row.
- [ ] Two samples in a group with the same non-empty description produce a warning and still save.
- [ ] A group of three samples with two tests selected produces six results on save.
- [ ] Each result is attributable to exactly one sample, identified by position and description.
- [ ] The number shown as the sample's position is the same number that appears as the suffix on
      its label and accession number.
- [ ] No screen renders the sample's number and the group's count together — the count appears only
      on the group header, and the string "of" never joins them.
- [ ] The existing labels section gains one row per non-voided sample, each headed by the sample's
      number and description via `sampleLabelFormatter`; voided samples do not appear.
- [ ] Nothing else in the labels section changes, and no legacy per-block label control remains on
      the page.
- [ ] Test and panel selection is unchanged from the shipped control — filter tags that remove on
      close, a panel search and a test search, click-to-select matches, a no-match message quoting
      the term, and the full checkbox lists.
- [ ] The storage location picker is the existing component, unchanged, placed once per group.
- [ ] The Description field is visibly the widest field in the sample row and still caps at 60
      characters.
- [ ] A printed specimen label shows the sample's position and its description when present.
- [ ] Adding a sample to an order that has already been placed asks for confirmation first, and the
      confirmation names how many pending tests it will create and lists them by name.
- [ ] On confirming, the sample is added and receives results for every test already on the group;
      on declining, the order is unchanged.
- [ ] A sample added after the order was placed is visibly flagged as such.
- [ ] The removal action is labelled **Remove** on both an unsaved and a saved sample; neither says
      Delete, and neither says Void.
- [ ] Removing an unsaved sample takes it off the form immediately, with no confirmation.
- [ ] Removing a saved sample opens a confirmation that captures a reason and states that the sample
      and its record stay on the order and its pending tests are cancelled.
- [ ] Removing a saved sample cancels its pending results, tags it Voided, and leaves every other
      sample's number unchanged — a group of three with sample 2 removed still reads "Sample 1" and
      "Sample 3", and the group header count reads 2.
- [ ] A sample with any validated result has the removal action disabled, with a visible explanation
      (not a hover-only tooltip).
- [ ] Changing a group's sample type prompts for confirmation and keeps the sample rows.
- [ ] Choosing a sample type that already has a group on the order does not create a second group;
      the user is told the group exists and offered to add a sample to it, and declining leaves the
      order unchanged.
- [ ] An order can never hold two groups of the same sample type.
- [ ] While tests for a newly chosen sample type load, the group shows a loading state and
      the in-group add action is disabled.
- [ ] Adding a sample after placement, and voiding a sample, both appear in the order's audit trail.
- [ ] Every string listed in the Localization table resolves from an i18n key that exists in
      `en.json`, or is delivered as part of this work; none is hardcoded.
- [ ] Samples in a group have no derivation relationship set between them.

---

## Design Governance Check

| Check | Result |
|---|---|
| Reuses existing data; new data declared (MUST A / D-009) | **Two** new attributes — sample description and the added-after-placement flag — declared in Dependencies, plus one required change to how the existing storage selection is applied. A third (per-sample specimen-label quantity) was declared in v1.2 and **withdrawn in v1.3** after verifying OGC-285's aggregation already provides it per sample. Everything else already exists per sample. |
| No multitenancy (MUST B / D-001) | No site, lab, or tenant selector anywhere in this feature. "Specimen origin (referent lab)" is an existing free-text field, not a cross-organisation view. |
| Shipped app is the style and route source (MUST C / D-008) | Extends the shipped `/SamplePatientEntry` page; no new route. Breadcrumb matches the two crumbs the shipped page renders. Localization keys verified against `en.json` on `develop`. |
| No hard delete (MUST D / D-002) | FR-26: saved samples are voided with a reason, never deleted — the action is *labelled* Remove for the collector's benefit, but the record is preserved and tagged Voided, and the confirmation says so in plain words. Pre-save form rows may be removed outright because nothing has been recorded. |
| Designed for large catalogs (MUST E / D-007) | No new picker introduced; the sample type and test selectors are unchanged, and storage uses the existing hierarchical picker rather than a flat list. |
| Specimen-is-identity preserved (D-028) | Untouched. A test still maps to exactly one sample type; this adds sample *instances*, not sample *types*, per test. |
| Selected items show labels, not counts | Sample rows show number **and** description; the group count tag accompanies the visible rows rather than replacing them. |
| Inline expansion, not modals (D-005) | Per-sample detail expands inline in the row. Modals are used only for confirmations with consequences: removing a saved sample, changing a group's sample type (which clears the test selection), adding a sample to a placed order (which creates work in the lab queue), and the duplicate-sample-type prompt. |

---

## Design principle — reproduce or stub, never redraw

Anything that already exists in the shipped application is either **reproduced exactly as shipped**
or **stubbed as a muted placeholder**. It is never redrawn from imagination. Only what is genuinely
new to this feature is designed.

In this feature that means: the sample type control, and the panel and test selection controls, are
reproduced exactly (FR-43); the storage location picker (FR-37) and the labels section (FR-17) are
shown as muted placeholders standing for the existing components. The HTML preview carries a note
explaining the convention so a reviewer does not mistake a placeholder for a design gap.

The rule exists because a redrawn approximation of an existing control reads as a specification for
a *new* control, and gets built as one. A muted box cannot be misread that way.

## Note for the JSX mockup

The HTML preview is a review artifact and approximates Carbon with plain markup. The JSX mockup
built at handoff must not: it uses `@carbon/react` components only — `Grid`/`Column` for layout
(no raw CSS grid), `DataTable` with inline row expansion for the sample rows and the label rows,
Carbon `Tag` for every status including **Voided**, Carbon `Modal` for the void and change-type
confirmations, `Select`/`ComboBox` for pickers, and Carbon spacing and colour tokens throughout —
no hardcoded hex values and no magic pixel spacing.
