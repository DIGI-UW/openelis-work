# Environmental and Vector Order Entry v4: Clarify Log

Date: 2026-09-26. One FRS covers both domains (Casey, 2026-09-26). It builds on Clinical Order Entry v4 (OGC-1266) and `env-vector-order-entry-alignment.md`.

## Decisions

### C-1 Numbering (Casey, 2026-09-26)

Containers use one numbering scheme across all three domains:

| What | Number |
|---|---|
| Sample | `{labNo}-1`, `-2` |
| Aliquot | `-1.1` |
| Environmental duplicate or split | `-1.1`, tagged QC |
| Environmental blank or field control | its own sample, `-2` and up, tagged QC |

D-082 becomes GLOBAL for containers.

**Vector pools keep pool labels.** An intake pool is `{labNo}-P01`, and sub-pools are `-P01-S1`, then `-S1-S2`. Pools are shown as group rows with a pool badge, never as tubes.

- **Why:** develop models a pool as a grouping (`VectorPool`) of organisms, each organism its own sample item. Deconvolution regroups those organisms; it doesn't divide material. This is `VectorPoolLabelServiceImpl` and `VectorDeconvolutionServiceImpl` at 44dbc44.
- **Correction owed:** the V-03 FRS, results-entry-v4 FR-I2, the style guide and env-vector-workflows still describe `LABNO.X-Y` and need correcting to match the code.
- **Parent links come from data only.** A parent is always found through the parent pointer or pool, never by parsing a label. `stripLastSegment` in develop splits on the last `-`, which is fragile when lab numbers contain dashes; flag it as a defect.
- **Aliquots:** the develop aliquot function already appends `.{n}` to the parent's external ID, so `-1.1` needs no new logic.

### C-2 Steps (Casey, 2026-09-26)

Both domains use **Enter Order** plus the optional **Sample check**. The domain's own acceptance setting switches Sample check off.

- **Enter Order** always shows the samples table. It holds the site, requester, samples, tests, storage, referral and labels.
- **Samples table:** environmental splits, duplicates and QC samples, and vector pooling, are all done here.
- **Retired routes:** `/order/environmental/label` and `/order/vector/label` are removed and redirect (D-066).
- **Vector's Complete page** becomes the Save and finish confirmation, and loses its "Cancel" primary button.
- **Deconvolution** is not order entry. It stays in V-03 (Vector Testing & Identification).

### C-3 Phasing (Casey, 2026-09-26)

**MVP, on the current screens, alongside the clinical MVP:**
- A whole-step save. It includes the sampling-site create, and the order form never overwrites an existing site.
- The two required levels, with the To continue checklist.
- Label removed.
- Blank dates are never stamped.
- Holding time runs from collection time.
- Vector stores the trap data for each sample. The collection row is kept as the real catch sample and is never deleted (C-6).

**Phase 2**, after clinical P7 and P1: the shared components, container types and QC or pool row kinds. This replaces clinical P17.

### C-4 Vector intake (Casey, 2026-09-26)

**One row per collection.** Each row holds:
- trap or site
- trap type
- traps deployed
- trap nights
- life stage
- organism group
- count

On save, OpenELIS creates the organisms and one intake pool (`-P01`) for each row. Every organism keeps its own row's trap data, which fixes today's first-row-only defect.

Species ID and re-pooling happen at the bench (V-03), not at intake.

### C-5 Environmental field QC (Casey, 2026-09-26)

Field QC is entered at intake as rows in the samples table.

| QC sample | Number | Tag | Tests |
|---|---|---|---|
| Field duplicate or split | under its parent, `-1.1` | QC Duplicate | |
| Field or trip blank | its own sample, `-3` | QC Blank | same as the batch by default |

- Intake fills the S-08 `SampleItemQcProfile` (qcType, parentSampleItemId), so evaluation needs no re-entry.
- Lab QC (method blanks, spikes, controls) stays at the bench.
- **Out of scope:** a warning when a compliance standard expects field QC. It would need new data on standards.

### C-6 Organism numbers (Casey, 2026-09-26)

**The catch is the sample.** Each collection row stays a real sample, `{labNo}-1`: the trap cup, holding the trap data. It is never deleted or voided.

- **Organisms** are its children, numbered `-1.1` to `-1.25`, the same child shape as an aliquot.
- **Intake pool** `-P01` groups them.
- **The next catch** is `-2`, with organisms `-2.1` onward.
- **Why:** the organism numbers are FHIR `Specimen` identifiers with `Specimen.parent` set to the catch. That removes the D-002 hard delete in `VectorPoolFanOutServiceImpl`, and fills the null organism `externalId`.

### C-7 Compliance standard (Casey, 2026-09-26)

The environmental compliance standard is required at the **complete** level.

- An order saves without one, but can't be finished until a standard is chosen.
- **No standard (investigative)** is an explicit choice that satisfies the requirement.
- Results are never judged without an explicit choice.
- This supersedes the OGC-1068 body ("Site + Compliance Standard required" at save).

### C-8 Lab-side scope for vector (Casey, 2026-09-26)

"We are the lab." Field operations happen upstream in the vector control program, before specimens arrive. Order entry therefore records only what the lab receives, tests and reports on.

**Dropped as upstream data:** zero-catch nights, trap failure, trap set and retrieval times, caught versus submitted, lure and placement, larval habitat and dips, host linkage.

**Kept as optional pass-through:** trap type, traps deployed and trap nights (C-4). They are recorded when the requisition carries them and never required. V-04 reads them when present.

**Amends C-4 with two intake shapes on the same row.** A row gains **Arrives as**:
- **Unsorted catch.** The bench sorts it and re-pools it (V-03).
- **Sorted pool.** The pool is tested as received. The row carries species, sex and feeding status as submitted, plus the organism count. The count is the pool size, which the infection-rate calculation needs.

Either way the row is the container, `-1`, with its organisms `-1.1` onward and pool `-P01` (C-6).

### C-9 Gap tiers (Casey, 2026-09-26)

Folded into this FRS, both domains:
1. **Sampling point per sample row.** Defaults from the order, and can be changed on each row. It matches the vector per-catch site.
2. **Field or submitter sample ID per row.** Environmental client ID or vector pool ID. Printed on labels and the report.
3. **Condition on receipt as measured values, shared:**
   - temperature per cooler or shipment, with the thermometer used
   - ice present
   - custody seals intact
   - container integrity
   - preservation check per container (pH for environmental; dry ice, RNAlater or ethanol for vector)
   An out-of-range value raises an NCE and a report qualifier.
4. **Holding time per test, from the test catalog.** Each row shows time remaining at intake. "Received out of hold" becomes a qualifier, and a rush priority is suggested.

**Phase 2, optional fields:**
- custody transfer log
- field measurements as results (field pH, chlorine residual)
- sample purpose (routine, repeat or confirmation) with a link to the original sample
- copy row and fill down
- report-to and invoice-to contacts, turnaround and due date
- retention date

**Future work, not this FRS:** bottle kits and pre-registration, recurring monitoring templates, field-app and FHIR import of collections, EDD and regulatory exports.

### C-10 Regulatory exports (Casey, 2026-09-26)

Regulatory exports ship as a **preset in Custom Data Export**, the existing feature under `reports/dataexport` in develop.

**What is already built:**
- Saved report definitions, loaded from `reporting-sources/*.json` through the distro configuration handler.
- The `SAMPLE_TESTING` source, which today has no environmental or vector fields.

**This FRS:**
- Captures the identifiers regulators key on:
  - the regulated system or permit ID on the sampling site
  - a sampling point code
  - **sample purpose** (routine, repeat or confirmation) with a link to the original sample, promoted from phase 2
  - the field sample ID
  - QC type
  - compliance standard
  - receipt and hold-time qualifiers
- Adds those fields to the export source.
- Ships two presets as distro JSON, **Environmental results (regulatory)** and **Vector pool results**. National formats are configured by editing or copying a preset, not coded.

**Queued last:** a separate design for expanded reporting.

### C-11 Where a sample came from (Casey, 2026-09-27)

A row's site can be a **sampling site** or a **location** from Locations & Organizations (ward, department or facility). That covers hospital surface swabs. For a submitted object, the site is optional, and the row records Object description and Source instead (EV-D3, D-101).

### C-12 Critique folded in (Casey, 2026-09-27)

All ten high-weight items and the smaller edits from `env-vector-order-entry-v4-critique.md` go into FRS v0.3. **Fast batch entry moves into the MVP:** keyboard grid, paste from a spreadsheet, copy row and fill down (EV-D9).

### C-13 Organisms from unsorted catches (Casey, 2026-09-27)

This amends C-6.
- **Unsorted catch:** only the count is stored at intake. The bench creates the organisms and pools when it sorts the catch (V-03).
- **Sorted pool:** the organisms are created at intake.
- **Labels:** organism labels are never printed by default (EV-H3, D-098).

### C-14 Domain switcher and lab units (from the clinical side thread, 2026-09-27)

- **Add Order:** one Add Order item, with a domain switcher on the dashboard and on a new order. This is clinical FR-A17 to A22 (D-093).
- **Lab units:** a lab unit serves one or more domains (D-094, confirmed). Sample type, panel, test and sample stay in one domain each.

### C-15 Round-two critique applied (Casey, 2026-09-28)

**Workflow changes:**
- **Holds.** An unsuitable-sample hold applies to the affected tests, not the order (D-102).
- **Customer instruction.** One form covers all selected problems.
- **Order defaults.** The decision rule agreement, Sampled by and requested methods come from a standing agreement on the requester or program, and conditions come from the last order (D-103).
- **Page order.** Samples come third, and the other sections collapse to one-line summaries.
- **Rows.** Compact single-line rows.
- **Receipt checks.** Temperature is required only where a receipt range applies. The preservation cell shows only where needed. Arrives as is set at the order level.
- **Labels.** The Labels section collapses to a one-line summary.

**UI changes:**
- **Selection.** A batch action bar appears when rows are selected.
- **Row actions.** Two row icons plus an overflow menu (amends D-078, D-104).
- **Alerts.** One signal per problem (D-105).
- **Keyboard.** A keyboard grid of text cells with typeahead.
- **Help and checklist.** Helper text on demand, and a sticky To continue count.

### C-16 Keep everything develop already has (Casey, 2026-09-29)

An audit of environmental and vector order entry on develop found items that v0.4 dropped or narrowed. Everything is kept or restored in FRS v0.5.

**Field data, kept as optional:**
- the Vector Field Survey panel and the program questionnaire
- the vector collection context (time of day, resting context, human-biting catch)
- the environmental water temperature, ambient temperature, field notes and location details

**QC at intake, kept:**
- controls with expected values
- blanks associated with the samples they cover
- the threshold gating on the QC buttons

This amends C-5 and C-8.

**Per-row overrides.** Received date and time, and Sampled by, can be set on an individual row.

**Environmental row GPS.** It stays visible, as it is today.

**Restored:**
- storage condition notes and "skip storage"
- referral dispatch
- the order-level non-conformity report
- the dashboard columns, filters and actions
- remember site and requester
- the leave prompt
- the saved-order view
- site details on Sample check
- the fields on the new-site form
- panels on each row
- a path to correct a site (a link to Sampling Sites)

**Also:** the requesting organization and contact are no longer editable from the order form.

## Next

FRS v0.4 written. Next: update the preview; then `/analyze`.
