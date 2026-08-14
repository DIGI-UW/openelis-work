# Combined Collections at Order Entry — Functional Requirements Specification

> ## ⚠ WITHDRAWN — do not implement from this document
>
> **Withdrawn 2026-08-12.** This specification is superseded before review by a merged
> spec, *Derived & Calculated Results*, which will own both the collection capture
> described here and the calculation that consumes it.
>
> **Two reasons it was withdrawn:**
>
> 1. **Nothing here pays off on its own.** This spec captures the total volume and the
>    collection window and then explicitly declines to compute the per-24-hour result. The
>    bench would enter more data and get the same output, so the only consumer of the data
>    is a feature that does not exist yet. Specifying the consumer first means capturing
>    exactly the right shape once, rather than guessing at it now and reworking it later.
>
> 2. **Its central design decision is wrong.** This spec makes "combined collection" a
>    **mode the collector chooses** (FR-1, FR-2). That is the wrong signal. Whether a
>    collection is a 24-hour collection is determined by the **test that was ordered** — a
>    24-hour urine protein is a different test from a random urine protein, with its own
>    LOINC code, its own reference ranges, and its own reporting units. The ordering
>    clinician, who told the patient to collect for 24 hours, has already declared the
>    protocol by choosing that test. Asking the collector to declare it again in a mode
>    chooser taxes every routine order to serve a rare one, invites the wrong choice, and
>    duplicates information the order already carries.
>
> **What carries forward into the merged spec:** the Lab Context narrative, the container
> model (containers are collection events, not specimens), the collection-window and
> completeness concepts, the four declared data elements, and the whole `pool`-namespace
> collision analysis in the Localization section. The mode chooser (FR-1 through FR-6) does
> not carry forward and is replaced by a per-test collection protocol.
>
> Kept for the record rather than deleted, per the project's preserve-don't-delete
> convention. The research and the container model in it remain sound.

**Version:** 2.0 (withdrawn)
**Date:** 2026-08-12
**Author:** OpenELIS Global product design
**Status:** WITHDRAWN — superseded by *Derived & Calculated Results* (not yet written)
**Affects:** Add Order (`/SamplePatientEntry`), Edit Order, specimen labels, result entry display, patient report
**Was building on:** *Multiple Samples per Test at Order Entry* v1.1

---

## Relationship to v1

v1 handles the case where several collections are each **tested separately** and each produce
their own result — three sputum specimens for tuberculosis, three stool specimens for parasites,
three timed urines. Each collection is a specimen in its own right.

v2 handles the opposite case: several collections that are **combined into one specimen** and
tested once, producing one result. A 24-hour urine arriving in four bottles is one specimen, not
four. The four bottles are collection events, not specimens.

The two are complementary and the collector chooses between them per group. Everything v1
specified stands unchanged; v2 adds a mode.

---

## Lab Context

### Current State

Some laboratory tests are not run on a single container of material. A 24-hour urine collection
asks the patient to collect **every** urine passed over a full day, starting after the first
morning void and ending with the first void of the next morning. That is commonly 1.5 to 2.5
litres, which does not fit in one bottle, so the patient goes home with two, three, or four
containers and brings them all back together.

What the laboratory does with them is the important part. The technician does **not** test each
bottle. They measure the volume in every bottle, add those volumes together to get the total
volume for the 24 hours, pour the bottles into one vessel, mix thoroughly, take a single small
aliquot from the mixed pool, and run the test once on that aliquot. The result is a
concentration — say, milligrams of protein per litre — and it is only clinically meaningful once
it is multiplied by the total volume to give the amount excreted over the whole 24 hours. Get the
total volume wrong and the result is wrong, no matter how good the analysis was.

The same shape appears in environmental work. A composite water sample is several grab samples
taken from different points or at different times along a channel, combined into one container
and tested once as a single characterisation of the site.

Today OpenELIS has no way to say this. The person at reception registers one sample and types a
single quantity into the quantity field. Whatever the total volume actually was, and however many
bottles it came in, is either lost or written on a piece of paper taped to the vessel. The start
and end times of the collection window are not recorded anywhere, so nobody can later check
whether the collection really ran for 24 hours.

### Pain

The lost total volume is the sharp edge. When the analyser reports "0.28 g/L of protein", that
number on its own tells a clinician almost nothing — it depends entirely on how dilute the urine
was. The clinically actionable number is grams per 24 hours, and computing it needs the total
volume, which OpenELIS never captured. So the technician works it out on a calculator, writes it
in a free-text comment, and the structured result field holds the concentration while the number
the doctor actually reads sits in a comment nobody can trend, chart, or export.

The incompleteness problem is next. A 24-hour urine collection is genuinely difficult for
patients — the single most common failure is that they discard one void by mistake. An incomplete
collection produces a falsely low result and can send a clinician down the wrong path entirely. A
laboratory that has recorded the total volume and the actual start and end times can spot a
collection that ran for fourteen hours or produced 400 mL and flag it. A laboratory that recorded
neither cannot, so the incomplete collection is reported as though it were sound.

And where a patient brings back four bottles and one goes missing between reception and the
bench, nothing records that four arrived.

### What Changes

The person at reception chooses "Urine", ticks the test, and switches the group to a **combined
collection**. Instead of one quantity field they get a small table with one row per container:
the container's own label, its volume, and when it was collected. They enter four rows. OpenELIS
adds the volumes and shows the total, and records the start of the collection window as the
earliest entry and the end as the latest — both overridable, because a 24-hour collection's
official start is the time the patient was told to begin, not the time of the first bottle.

One specimen is created, one label prints, one result comes back. The total volume and the
collection window travel with the specimen, so the result can be expressed per 24 hours instead
of per litre, and a technician looking at a 14-hour window or a 400 mL total can see the problem
before the result is released. If the collection is known to be incomplete, the technician marks
it so and the report carries that caveat.

---

## Overview

This specification adds a **combined collection** mode to a sample group on the Add Order page.
In combined mode the group produces **one specimen** assembled from several recorded collection
events, with a summed total volume and an explicit collection window, rather than one specimen
per collection.

The distinction is the one the relevant standards already draw: a specimen may be marked as
combined, and a combined specimen references the collections it was assembled from. A result
still points at exactly one specimen, which is what keeps this compatible with everything
downstream — analysers, referral messages, and reports all continue to see one specimen with one
result.

Two things this deliberately does **not** do. It does not pool material from more than one
patient — that is a fundamentally different operation requiring follow-up testing of individuals
when a pool is positive, and it belongs to the environmental and vector surveillance work, not
here. And it does not compute results; it captures the total volume and the collection window
that a result calculation needs, and leaves the calculation itself to the test's own
configuration.

### Navigation & URL

- **SideNav placement:** `Order → Add Order` (unchanged — this modifies the existing page)
- **Breadcrumb:** `Home / Add Order` (unchanged — the two crumbs the shipped page renders; keys
  `home.label` and `breadcrumb.label.addOrder`)
- **URL route:** `` `/SamplePatientEntry` `` (unchanged)

The same section appears on **Edit Order**, for adding a container to a collection already
registered.

---

## User Stories

- **As a person receiving samples at reception,** I want to record each container of a 24-hour
  urine separately and have OpenELIS total the volume for me, so that the total is right and I am
  not doing arithmetic on a scrap of paper.
- **As a laboratory technician,** I want the total volume and the actual collection window stored
  with the specimen, so that a result can be reported per 24 hours instead of per litre.
- **As a laboratory technician,** I want to mark a collection as incomplete and say why, so that a
  falsely low result is not released as though the collection were sound.
- **As a validator,** I want to see the collection window and total volume next to the result, so
  that I can refuse to release a result from a collection that plainly did not run its full course.
- **As a clinician reading the report,** I want to see that the result came from a 24-hour
  collection of a stated volume, so that I can judge how much weight to put on it.

---

## Functional Requirements

### Choosing the mode

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | A sample group offers two collection modes: **Separate samples** (the v1 behaviour, the default) and **Combined collection**. | The mode is a property of the group, chosen by the collector. |
| FR-2 | Separate samples is always the default. A group is never in combined mode unless the collector puts it there. | No configuration and no test-catalog setting selects the mode. |
| FR-3 | In combined mode the group produces exactly **one** specimen, regardless of how many containers are recorded. | This is the whole distinction from v1. |
| FR-4 | Switching a group from separate to combined when it already holds more than one sample requires confirmation, and explains that the samples become containers of a single specimen and their individual test assignments collapse to one set. | Destructive to the existing structure, so a modal is warranted. |
| FR-5 | Switching a group from combined to separate requires confirmation, and explains that each container becomes its own specimen with its own result. | |
| FR-6 | Neither switch is offered once the order has been saved. Changing the mode of a placed order is not supported. | Results already exist against a structure; silently restructuring them is unsafe. |

### The container list

| ID | Requirement | Notes |
|---|---|---|
| FR-7 | A group in combined mode presents a **container list**: one row per container, each with a container label, a volume, a unit of measure, and a collection date and time. | Replaces the group's single quantity field. |
| FR-8 | The container list opens with one row. An **Add container** action appends a row. | Mirrors the v1 add interaction. |
| FR-9 | The container label is optional free text of up to 60 characters, for what is written on the bottle — "Bottle 1", "green cap", "overnight". | |
| FR-10 | Volume is required on every container row. A row with no volume cannot be saved. | The total is the point of the feature; a blank row silently understates it. |
| FR-11 | All container rows in one group share a single unit of measure, set once for the group. | Adding millilitres to litres is a defect waiting to happen. |
| FR-12 | The **total volume** is the sum of the container volumes, recalculated live as rows are edited, and displayed prominently. It is not directly editable. | Derived, so it cannot drift from its parts. |
| FR-13 | A container row may be removed at any time before the order is saved. Removing the only row is not possible. | |
| FR-14 | The container list has no configured minimum or maximum. A warning appears at 12 containers; adding more remains permitted. | Same soft-guard shape as v1. |

### The collection window

| ID | Requirement | Notes |
|---|---|---|
| FR-15 | The group records a **collection start** and a **collection end**, each a date and time. | New information — see Dependencies. |
| FR-16 | Start defaults to the earliest container's collection date and time; end defaults to the latest. Both defaults are shown as such and both are editable. | A protocol's official start is the time the patient was instructed to begin, which may precede the first container. |
| FR-17 | Editing start or end directly marks that value as collector-stated rather than derived, and the display says so. | So a validator can tell a recorded window from an inferred one. |
| FR-18 | The **elapsed duration** between start and end is displayed alongside them, updating live. | The number a technician actually checks against the protocol. |
| FR-19 | An end earlier than the start is rejected with an inline error. | |
| FR-20 | The collection window travels with the specimen and is visible wherever the specimen's collection date is already shown. | |

### Completeness

| ID | Requirement | Notes |
|---|---|---|
| FR-21 | A combined collection carries a **completeness** state: complete (the default) or incomplete. | New information — see Dependencies. |
| FR-22 | Marking a collection incomplete requires a reason chosen from a configurable list, with an optional free-text note. | Reasons are reference data, not hardcoded — labs and programmes differ. |
| FR-23 | An incomplete collection is visibly flagged at result entry, at validation, and on the patient report. | The flag is worthless if it stops at order entry. |
| FR-24 | Marking a collection incomplete does not block ordering, resulting, or validation. It is a caveat, not a gate. | The laboratory decides what to do with a short collection; the software records it. |
| FR-25 | Completeness may be changed on a placed order until the order's results are validated. Changes are recorded in the audit trail. | Incompleteness is usually discovered at the bench, after registration. |

### Identity, labels, and results

| ID | Requirement | Notes |
|---|---|---|
| FR-26 | The single specimen produced by a combined group receives one specimen identifier under the order's lab number, following the existing scheme. Containers are **not** separately accessioned. | Containers are collection events, not specimens. |
| FR-27 | One specimen label prints for the group. The label shows the total volume and the container count — for example "2 340 mL · 4 containers". | So the vessel on the bench states what it is. |
| FR-28 | Each selected test on a combined group produces exactly **one** result. | |
| FR-29 | Wherever the specimen is shown — result entry, validation, worklists, the patient report — it is identified as a combined collection, with its total volume, collection window, elapsed duration, and completeness state available. | |
| FR-30 | The container list is available as a detail view from the specimen, showing every container's label, volume, and collection time. | For the case where a technician needs to reconstruct what arrived. |
| FR-31 | Adding a container to a placed order updates the total volume and, where the added container falls outside the current window, the derived start or end. The change is recorded in the audit trail. | |
| FR-32 | A container is never deleted from a placed order. It is voided with a reason, and a voided container is excluded from the total volume while remaining visible in the container list. | Consistent with the no-hard-delete rule applied to specimens. |

### Empty, loading, and error states

| ID | Requirement | Notes |
|---|---|---|
| FR-33 | A combined group with no test or panel selected cannot be saved, as in separate mode. | |
| FR-34 | A combined group whose container rows sum to zero cannot be saved. | |
| FR-35 | If the unit of measure is changed after volumes have been entered, the values are kept unchanged and a warning states that the volumes were not converted. | Silent conversion is worse than a warning. |
| FR-36 | If saving fails, the full container list, window, and completeness state are preserved in the form. | |

---

## Information & Data

An order (the `Sample` record, carrying the lab number) holds one or more specimens (`SampleItem`
records). In separate mode a group's collections each become a specimen, as v1 specified. In
combined mode the group's collections become **containers** of a single specimen.

A container is not a specimen. It is not accessioned, not labelled, not tested, and produces no
result. It records what physically arrived: a label, a volume, and when it was collected. The
specimen it belongs to is what the laboratory tests.

| Information | Where it lives | Status |
|---|---|---|
| Sample type, collector, collection method, temperature, specimen origin | The specimen | Already recorded |
| Rejected, rejection reason, voided, void reason | The specimen | Already recorded |
| Sort order, external identifier | The specimen | Already recorded |
| Quantity | The specimen — in combined mode this holds the derived total volume | Already recorded |
| Unit of measure | The specimen | Already recorded |
| Storage location | The group, applied to the specimen | Per v1 |
| Combined marker | The specimen | **New** |
| Container label, container volume, container collection date and time | A container record belonging to the specimen | **New** |
| Collection start and end, and whether each was derived or stated | The specimen | **New** |
| Completeness state, reason, note | The specimen | **New** |

### Lifecycle

A combined specimen follows the same lifecycle as any other: entered → collected/received →
results recorded → validated, with rejection at receipt and voiding after placement available as
they are for any specimen. A **container** has a much smaller lifecycle: it exists, or it is
voided with a reason. Containers are never rejected independently; rejection is a property of the
specimen.

### Uniqueness and derivation

Container rows within a specimen are ordered and their order is stable. Container labels need not
be unique. Total volume is always derived from the non-voided container rows and is never stored
independently of them. Collection start and end are derived until a collector overrides them, at
which point the stated value is stored and the derivation is not reapplied.

---

## Access

**Accessible via the existing roles that reach Add Order and Edit Order** — Reception and Admin.
No new role is introduced.

| Action | Who can do it | What everyone else sees |
|---|---|---|
| Switch a group to combined mode while placing an order | Reception, Admin | The Add Order page is not available to them |
| Add or edit a container while placing an order | Reception, Admin | Fields are read-only |
| Add a container to a placed order | Reception, Admin | The **Add container** action is not shown |
| Void a container on a placed order | Reception, Admin, while no result on the specimen has been validated | The void action is not shown |
| Override the collection start or end | Reception, Admin | Values are read-only |
| Mark a collection incomplete, or change the reason | Reception, Admin, and Analyst — the incompleteness is usually discovered at the bench | The control is not shown |
| See the total volume, window, duration, and completeness at result entry, validation, and on the report | Analyst, Validator, Provider — everyone who can already see the specimen | — |
| Configure the list of incompleteness reasons | Admin, via the existing reference-data administration | The list is not editable |

Marking a collection incomplete is the one capability that extends beyond Reception and Admin.
That is deliberate: the person who discovers a short collection is the technician measuring it,
not the person who registered it.

---

## Localization

Every visible string carries an i18n key. Keys marked REUSE were verified present in
`frontend/src/languages/en.json` on `develop`; the English column is the key's **actual** value in
the repo, which is not always the wording used elsewhere in this document.

### Reused

| UI text (actual repo value) | Key | Note |
|---|---|---|
| Sample | `label.button.sample` | Group heading |
| Sample Type | *(see v1 — the shipped select carries no separate label)* | |
| Collection Date | `sample.collection.date` | Container row |
| Collection Time | `sample.collection.time` | Container row |
| Collector | `collector.label` | Specimen level |
| Quantity | `sample.quantity.label` | Container volume — OpenELIS's existing word for volume |
| Sample Unit Of Measure | `sample.uom.label` | Group-level unit |
| Reject sample | `sample.reject.label` | Specimen level |
| Collection Method | `sample.collection.method` | Specimen level |
| Sample Temperature | `sample.temperature` | Specimen level |
| Specimen Origin (referent lab) | `sample.specimen.origin` | Specimen level |
| Label quantities | `barcode.labels.section.title` | Labels section |
| Running total | `barcode.labels.running.total` | Labels section |
| Add | `label.button.add` | Add container |
| Remove | `label.button.remove` | Remove container row |
| Cancel | `label.button.cancel` | Modals |
| Confirm | `label.button.confirm` | Modals |
| Save | `button.save` | |
| Close | `label.button.close` | |
| Notes | `label.results.notes` | Incompleteness note |
| Duration | `dataexport.status.attempt.duration` | Elapsed duration — generic enough to reuse |
| Start Date | `reports.startDate` | Collection window |
| End Date | `reports.endDate` | Collection window |
| Start Time | `dataexport.status.attempt.startTime` | Collection window |
| End Time | `dataexport.status.attempt.endTime` | Collection window |
| Container | `env.sample.container` | **PROMOTE** — currently namespaced to environmental sampling but the English is exactly right and domain-neutral. Add `common`-level or order-level key and repoint both rather than minting a near-synonym. |
| This field is required | `error.field.required` | Volume validation |
| Home | `home.label` | Breadcrumb |
| Add Order | `breadcrumb.label.addOrder` | Breadcrumb |

### New

Namespaced `order.sample.combined.*`. See the naming note below — this deliberately avoids the
`pool` namespace.

| UI text | Key |
|---|---|
| Collection mode | `order.sample.combined.mode.label` |
| Separate samples | `order.sample.combined.mode.separate` |
| Separate samples — each container is tested on its own and produces its own result. | `order.sample.combined.mode.separate.helper` |
| Combined collection | `order.sample.combined.mode.combined` |
| Combined collection — the containers are mixed and tested once, producing one result. | `order.sample.combined.mode.combined.helper` |
| Containers | `order.sample.combined.containers.title` |
| Add container | `order.sample.combined.container.add` |
| Container label | `order.sample.combined.container.label` |
| e.g. Bottle 1, green cap, overnight | `order.sample.combined.container.label.placeholder` |
| Container {position} | `order.sample.combined.container.position` |
| Total volume | `order.sample.combined.totalVolume` |
| {total} {unit} across {count} containers | `order.sample.combined.totalVolume.summary` |
| Volume is required on every container. | `order.sample.combined.volume.required` |
| Enter a volume greater than zero before saving. | `order.sample.combined.volume.zero` |
| This group already has {count} containers. Add more only if the collection requires it. | `order.sample.combined.container.countGuard` |
| Collection window | `order.sample.combined.window.title` |
| Derived from the containers | `order.sample.combined.window.derived` |
| Stated by the collector | `order.sample.combined.window.stated` |
| Elapsed | `order.sample.combined.window.elapsed` |
| {hours} h {minutes} min | `order.sample.combined.window.elapsedValue` |
| The end of the collection cannot be before its start. | `order.sample.combined.window.invalid` |
| Collection completeness | `order.sample.combined.completeness.title` |
| Complete | `order.sample.combined.completeness.complete` |
| Incomplete | `order.sample.combined.completeness.incomplete` |
| Reason the collection is incomplete | `order.sample.combined.completeness.reason` |
| Incomplete collection — interpret the result with caution. | `order.sample.combined.completeness.caveat` |
| Switching to a combined collection turns the {count} samples in this group into containers of a single specimen. They will share one set of tests and produce one result. | `order.sample.combined.switchTo.confirm` |
| Switching to separate samples turns each container into its own specimen, with its own label and its own result. | `order.sample.combined.switchFrom.confirm` |
| The collection mode cannot be changed once the order is placed. | `order.sample.combined.mode.locked` |
| Void container | `order.sample.combined.container.void` |
| Reason for voiding this container | `order.sample.combined.container.void.reason` |
| Voiding this container removes its volume from the total. The container stays on the record. | `order.sample.combined.container.void.explanation` |
| Voided — excluded from the total | `order.sample.combined.container.voided.tag` |
| The volumes were not converted. Check each container against the new unit. | `order.sample.combined.unitChanged.warning` |
| Combined collection · {total} {unit} · {count} containers | `order.sample.combined.specimen.summary` |
| Show containers | `order.sample.combined.containers.expand` |
| Hide containers | `order.sample.combined.containers.collapse` |

### Naming note — do not reuse the `pool` namespace

`en.json` on `develop` already carries 74 keys containing "pool", and **every one of them belongs
to vector surveillance or quality-control lots**. Their user-facing shape is `Pool of {count}
{animal}` (`label.type.pool`, `order.context.poolOf`, `vector.pool.summary`, and three more with
identical values), plus `result.pool.intake`, `result.pool.subpool`, and the deconvolution keys.
Reusing any of them here would render a 24-hour urine as "Pool of 4 mosquito".

The two vocabularies must stay apart, because the underlying concepts are different: vector
pooling combines material from **many subjects** and requires deconvolution — retesting
individuals when a pool is positive — whereas a combined collection combines containers from
**one patient** and has no deconvolution step at all. This specification therefore uses "combined
collection" throughout and namespaces its keys `order.sample.combined.*`.

`label.pool.expand` / `label.pool.collapse` ("Show individual specimens" / "Hide individual
specimens") are the one genuinely domain-neutral pair in that set and were considered for the
container disclosure. They are deliberately **not** reused, because their English says "specimens"
and containers are explicitly not specimens.

---

## Dependencies

### New data elements

1. **Combined marker on a specimen.** A flag distinguishing a specimen assembled from several
   containers from an ordinary one. Nothing equivalent exists: a repository-wide search finds no
   `pooled`, `isPool`, or `combined` field on any specimen valueholder or in any liquibase
   changeset.

2. **Container record.** A child record of a specimen holding a label, a volume, and a collection
   date and time, plus a voided flag and void reason. `sample_item` has no container concept and
   no container table exists.

3. **Collection window.** A start and an end, each a date and time, plus a marker on each
   recording whether it was derived from the containers or stated by the collector. The specimen
   carries a single `collection_date` timestamp today — one point in time, with no start/end pair.
   A search for `collection_start` and `collection_end` across the resources tree returns nothing.

4. **Completeness state, reason, and note.** With the reason list held as configurable reference
   data, following the pattern already used for rejection reasons.

Total volume is **not** a new data element: it is derived from the container rows and written into
the specimen's existing quantity field. The existing `sequence_number` column on the specimen may
serve to order container records if they are modelled as ordered children — worth a look before
adding another ordering column.

### Upstream and cross-feature

5. **Must not reuse the specimen derivation relationship.** The specimen record already carries a
   parent/child relationship used for **aliquoting** — dividing one collected specimen into
   portions, decrementing volume from the parent. Combining is the inverse operation: many sources
   producing one specimen, with volumes summing rather than decrementing. Reusing that
   relationship would corrupt aliquot volume tracking. Containers are a separate relationship.

6. **v1 must ship first.** This specification adds a mode to the sample group that v1 introduces.
   Without v1 there is no group to add a mode to.

7. **Environmental and vector order entry (OGC-527).** That work owns cross-subject pooling,
   `LABNO.X-Y` numbering, and deconvolution, and it shares the order-entry wizard and the `Sample`
   and `SampleItem` entities. The two must not converge by accident. The boundary to hold: this
   specification combines containers **from one patient or one sampling point**, with no
   deconvolution; OGC-527 pools material **across subjects** and must be able to retest them
   individually. Where composite environmental sampling is concerned the two genuinely overlap,
   and OGC-527 should be the one to decide which model an environmental composite uses.

8. **Result calculation is out of scope but is the reason this exists.** Expressing a result per
   24 hours rather than per litre requires multiplying a concentration by the total volume. This
   specification captures the total volume and makes it available; it does not perform the
   calculation. Whoever specifies calculated results should treat the total volume and the elapsed
   duration as available inputs.

9. **Labels.** The specimen label gains a total-volume and container-count line. Coordinate with
   the Label Presets work (OGC-285) so this lands inside the labels model rather than beside it.

10. **Downstream display, four screens.** Result entry, validation, worklists, and the patient
    report each need to show the combined marker, total volume, window, and completeness caveat
    (FR-23, FR-29). Display-only, but it spans four surfaces and should be coordinated as one
    piece of work rather than four.

---

## Out of Scope

- **Pooling across patients or subjects.** Minipool nucleic-acid testing, pooled screening, and
  vector pools all combine material from several subjects and require deconvolution when a pool is
  positive. That is a different feature with a different risk profile and it belongs with OGC-527.
- **Calculated results.** Multiplying a concentration by the total volume to give an excretion
  rate. This specification supplies the inputs; the calculation is specified elsewhere.
- **Automatic adequacy checking.** Judging a 24-hour urine collection as inadequate from its
  total creatinine, or from a short elapsed duration, is clinical logic. OpenELIS records the
  numbers and lets the technician mark the collection; it does not judge.
- **Unit conversion** between container volumes (FR-35 warns rather than converts).
- **Patient-facing collection instructions** — printing the "start after your first morning void"
  sheet the patient takes home.
- **Changing collection mode after an order is placed** (FR-6).
- **Separately accessioning or labelling containers.** Containers are collection events; if a
  laboratory needs each container individually identified and tested, that is v1's separate mode,
  which is the correct model for that case.

---

## Acceptance Criteria

- [ ] A sample group offers Separate samples and Combined collection, defaulting to Separate.
- [ ] Switching a multi-sample group to Combined prompts for confirmation and explains the effect.
- [ ] A combined group presents a container list with label, volume, and collection date and time
      per row, and a single group-level unit of measure.
- [ ] Adding and removing container rows updates the displayed total volume live.
- [ ] A container row with no volume, or a group whose volumes sum to zero, cannot be saved.
- [ ] Collection start defaults to the earliest container and end to the latest, both labelled as
      derived, and both editable.
- [ ] Overriding start or end relabels that value as stated by the collector.
- [ ] Elapsed duration is displayed and updates live.
- [ ] An end before the start produces an inline error and blocks saving.
- [ ] A combined group with three tests and four containers produces one specimen and three results.
- [ ] One specimen label prints, showing total volume and container count.
- [ ] Marking a collection incomplete requires a reason from the configurable list and does not
      block ordering, resulting, or validation.
- [ ] The incompleteness caveat appears at result entry, at validation, and on the patient report.
- [ ] A container can be added to a placed order, updating the total and, where applicable, the
      derived window; the change appears in the audit trail.
- [ ] A container on a placed order offers Void, not Delete; a voided container leaves the total
      and stays visible in the list.
- [ ] The collection mode cannot be changed once the order is placed.
- [ ] Changing the unit of measure after volumes are entered warns that no conversion was applied.
- [ ] Every string in the Localization table resolves from a key that exists in `en.json`, or is
      listed as New.
- [ ] No key in the `pool` namespace is reused.
- [ ] Containers do not use the specimen derivation relationship.

---

## Design Governance Check

| Check | Result |
|---|---|
| Reuses existing data; new data declared (MUST A / D-009) | Four new elements declared, each verified absent from the valueholders and liquibase. Total volume is explicitly derived into the existing quantity field, not a new column. |
| No multitenancy (MUST B / D-001) | No site, lab, or tenant selector. |
| Shipped app is the style and route source (MUST C / D-008) | Extends `/SamplePatientEntry`; breadcrumb is the two crumbs the page actually renders. |
| No hard delete (MUST D / D-002) | FR-32: containers on a placed order are voided, not deleted, and remain visible. Pre-save rows may be removed because nothing has been recorded. |
| Designed for large catalogs (MUST E / D-007) | The incompleteness reason list is reference data and uses the existing reason-select pattern; no new large-set picker is introduced. |
| Specimen-is-identity preserved (D-028) | Untouched. No change to how a test maps to a sample type. |
| Selected items show labels, not counts | The container list always renders every container's label and volume; the count and total accompany the rows rather than replacing them. |
| Inline expansion, not modals (D-005) | Container rows are inline. Modals are used only for the two mode switches and the container void — all destructive. |
| No namespace collision | The `pool` namespace is explicitly not reused, and the reason is recorded in the Localization section. |

---

## Note for the JSX mockup

When this reaches `/breakdown`, the mockup must use Carbon `Grid` and `Column` for layout and
`DataTable` for the container list, with inline row expansion for container detail. Status
indicators — voided containers, the incompleteness caveat, the derived-versus-stated window
markers — use `Tag` with a mapped `kind`, not styled text. `Modal` is used for the two mode
switches and the container void confirmation only. No hardcoded colours or spacing values; Carbon
tokens throughout.
