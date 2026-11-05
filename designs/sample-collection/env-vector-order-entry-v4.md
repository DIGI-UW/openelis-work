# Environmental and Vector Order Entry v4: Functional Requirements Specification

| | |
|---|---|
| **Version** | v0.5 (keeps every existing capability found by the develop audit: field survey, collection context, field measurements, controls at intake, blank association, storage notes, dispatch, order-level NCE, dashboard, leave prompt). Earlier: v0.4.2 (EV-B3a and EV-M2a follow Microbiology v2 draft 8: no Microbiology section and no Program coupling, the environmental culture test is ordered like any test, purpose defaults on the Case; v0.4.1: EV-B3a and EV-M2a follow Microbiology v2 draft 7: Culture rows, Program set by generic culture tests, purpose per case; v0.4: round-two critique: holds on tests not orders, one customer-instruction form, standing agreements as defaults, samples first, compact rows, batch action bar, one signal per problem, keyboard grid) |
| **Date** | 2026-09-29 |
| **Author** | Casey Iiams-Hauser (Director of Product) |
| **Status** | Draft for review |
| **Domain** | Environmental and vector order entry. The shared parts come from Clinical Order Entry v4 (FRS v0.9, OGC-1266) and are cited, not repeated. |
| **Preview** | `env-vector-order-entry-v4.html` |
| **Companions** | `env-vector-order-entry-v4-critique.md`, `env-vector-order-entry-v4-clarify.md`, `env-vector-order-entry-v4-crosscheck.md`, `env-vector-order-entry-v4-research-brief.md`, `env-vector-order-entry-v4-design-brief.md` |
| **Supersedes** | `env-vector-order-entry-alignment.md` (its changes are carried here); Environmental Order Entry v2 §5.2 and §5.3 (three-step wizard); the vector Label and Complete steps |
| **Checked against** | develop 44dbc44 (2026-09-26) |

## Lab Context

### Current State

**Environmental.** A public health or environmental laboratory receives water, soil, food and surface-swab samples. They come from inspectors, water utilities, industry or program staff, usually several bottles at a time, in a cooler with ice and a chain-of-custody form. A chain-of-custody form is the signed paper that lists every bottle and records who handed it to whom, and when. One form often covers a whole monitoring run, for example 20 bottles from 8 sampling points on one river. Reception checks the cooler temperature and the bottles, then types the order into OpenELIS: the site, who asked for the testing, the regulation that applies (the "compliance standard"), each bottle and the tests on it. A hospital microbiology unit does the same for infection-control surface swabs from its wards and for submitted objects such as a food item or a device, alongside its patient samples. Field quality control samples come in the same cooler: a "blank" (bottled clean water that should test clean) and a "duplicate" (a second bottle filled at the same point).

**Vector.** A vector surveillance laboratory receives insects and other disease carriers (mosquitoes, flies, fleas, ticks) collected by a vector control program's field teams. They arrive as a trap's whole catch, or already sorted into "pools": a tube of up to 50 mosquitoes of one species, tested together for a virus. Reception records where and when each catch or pool was collected, what it is and how many organisms it holds, then prints labels. The bench later identifies species and, when a pool tests positive, splits it into smaller pools to find the positive insect ("deconvolution").

### Pain

- **Saves go half-way.** The sampling site is created before the order is checked, outside the save, so a failed save leaves a new site behind. Storage is saved one bottle at a time on a second screen, and referral is a third separate save. When the network drops, some bottles are stored and others are not.
- **Existing sites get overwritten.** Unlocking the site on the order form and changing a letter renames the real site for every past order. A new site whose code matches an old one silently becomes the old one.
- **Wrong times are recorded.** A blank collection or receipt time is filled in with "now", so a bottle collected yesterday looks collected at receipt. Holding time (how long a sample may wait before testing, for example 8 hours for coliform bacteria) is counted from receipt at intake and from collection on the results screen, so the two screens disagree.
- **Vector data is lost.** Trap type, number of traps and trap nights are kept only from the first catch; every other catch in the order silently gets the first one's values. The organisms created from a catch have no sample number. The catch record itself is deleted outright.
- **Nothing says what is missing.** Save is disabled with no reason. The environmental validation message says "add a sampling site and sample type" when the real problem is a missing test (OGC-1060). The Print Labels panel on environmental does nothing and offers pathology slide and block labels.
- **No place for what regulators and reports need.** The client's own bottle ID, which sampling point each bottle came from, whether the cooler arrived cold, and whether a sample is a routine or a repeat check all live on paper only.

### What Changes

Reception works through one page in the order of the chain-of-custody form: order details, site and requester, compliance standard or surveillance program, collection conditions, then the samples table. The table always shows every bottle or catch on its own row, with its sampling point, the client's sample ID, collection time, tests, time left before the holding time runs out, and storage. Field blanks and duplicates are added as rows, marked as QC. Vector catches and pools each get one row, which expands to show the organisms it holds. A receipt panel records the cooler temperature and seals once, with a preservation check per bottle. Anything out of range raises a non-conformity and prints a note on the report. One Save stores everything or nothing, and never touches an existing site. If something is missing, a list above the footer names it. An optional Sample check step follows, as in clinical. Once saved, the results can go to a regulator through a shipped Custom Data Export preset.

---

## Overview

This feature aligns environmental and vector order entry with Clinical Order Entry v4.

- **Steps.** Each domain gets one working step, **Enter Order**, with the samples table always shown, plus the optional **Sample check** step. The Label step and vector's Complete page are removed.
- **Shared rules from clinical, used as specified there:** whole-step saves (D-072), the two required levels and the To continue checklist (D-074), the server clock (D-075), and numbering.
- **Environmental additions:**
  - a sampling point on each sample
  - the field sample ID
  - a condition-on-receipt record
  - holding time for each test
  - field QC rows
- **Vector additions:**
  - Catches and sorted pools are containers, each with its organisms numbered underneath.
  - Pools keep their group labels.
- **Reporting.** The identifiers regulators key on are captured at intake. Two regulatory exports ship as Custom Data Export presets.

### Design principles

The nine clinical principles apply as written (Clinical FRS, Overview). Three more come from this work:

10. **The container is the sample.** A bottle, a trap catch or a submitted pool tube is a sample with a number. Organisms and QC splits are its children. Nothing physical is ever deleted.
11. **Record what the lab receives.** Field operations belong to the upstream program. Order entry records what arrived, what state it was in, and what the lab will test and report.
12. **Capture once, report many.** Every identifier a report or regulator needs is entered at intake, on the row it belongs to, and never retyped.

### Navigation & URL

| Page | SideNav | Breadcrumb | Route |
|---|---|---|---|
| Environmental dashboard | Orders & Patients → **Add Order**, then Environmental in the domain switcher (clinical FR-A17; verify placement against the navigation redesign, OGC-1241) | `Home / Orders / Environmental Orders` | `/order/environmental` |
| Environmental Enter Order | (step within the order) | `Home / Orders / Environmental Orders / Enter Order` | `/order/environmental/enter` |
| Environmental Sample check (optional) | (step within the order) | `Home / Orders / Environmental Orders / Sample check` | `/order/environmental/qa` |
| Vector dashboard | Orders & Patients → **Add Order**, then Vector in the domain switcher (as above) | `Home / Orders / Vector Orders` | `/order/vector` |
| Vector Enter Order | (step within the order) | `Home / Orders / Vector Orders / Enter Order` | `/order/vector/enter` |
| Vector Sample check (optional) | (step within the order) | `Home / Orders / Vector Orders / Sample check` | `/order/vector/qa` |
| Sampling Sites admin | existing (placement per navigation redesign) | existing | existing Sampling Sites admin page |
| Custom Data Export | Reports → Custom Data Export (existing) | existing | existing Custom Data Export page |

**Route notes:**
- **Retired routes.** `/order/environmental/label`, `/order/vector/label` and `/order/vector/complete` are removed and redirect to the order's next unfinished step (D-066 Remove, clinical FR-A16). `/order/environmental/collect` already redirects, which settles OGC-1050.
- **Step order.** Save and finish on Enter Order goes to Sample check when it is on. Otherwise it completes the order and returns to the dashboard with a confirmation, which replaces vector's Complete page. The confirmation shows the lab number, the number of samples (vector: organism group and count per row), held tests if any, and for vector "These samples now appear in the Vector Identification worklist" (the V-03 hand-off the Complete page announced).
- **Opening an order.** `?id=` on any step opens that order's saved data (clinical FR-A15).
- **Domain switcher.** Clinical FR-A17 to A22 apply to both domains: one Add Order item, a switcher on the dashboard and on a new Enter Order, the lab number and shared fields kept when switching after a confirmation, and the domain fixed at first save. A laboratory whose microbiology unit takes both patient samples and environmental swabs or submitted objects switches here instead of going back to the menu. The test chooser offers only tests whose sample type is in this domain (clinical FR-B14).

---

## User Stories

1. As a **receptionist at an environmental laboratory**, I want to enter a whole cooler from one chain-of-custody form, with each bottle's sampling point, client ID and QC role on its own row, so that one Save registers the batch exactly as it arrived.
2. As a **receptionist**, I want to record the cooler temperature, the seals and each bottle's preservation check once at receipt, so that problems become a non-conformity and a report note without anyone writing them twice.
3. As a **receptionist at a vector laboratory**, I want to register each catch or submitted pool with its site, date, organism group and count, so that every organism gets a number and a label and nothing from another row overwrites it.
4. As an **analyst**, I want every sample to show how much holding time is left for each of its tests, so that I test the most urgent samples first and know which results will carry an "out of hold" note.
6. As a **receptionist in a hospital microbiology unit**, I want to register environmental surface swabs against the ward they came from, and submitted objects with a description and source, using the same Add Order item I use for patient samples, so that infection control results trace to the right place.
5. As a **laboratory manager**, I want saved environmental and vector results to export to our regulator's format from a shipped preset, so that compliance reporting needs no retyping.

---

## Functional Requirements

Requirement IDs use the prefix **EV**. "Clinical FR-x" means the requirement of that ID in Clinical Order Entry v4 FRS v0.8, which applies here as written unless a row below says otherwise.

### A. Shared rules applied to both domains

| ID | Requirement | Notes |
|---|---|---|
| EV-A1 | **Saving and navigation:** clinical section A applies, covering FR-A1 to A3 (the footer: Discard, Save and exit, Save and next or Save and finish), A5 and A6 (one all-or-nothing save; nothing lost on failure), A7 to A11 (two required levels, required markers, To continue checklist, disabled actions explain themselves, messages), A12 (progress indicator with two or one segments), A13 (no duplicates on retry), A14 (lab number reserved on open) and A15 and A16 (resets and redirects). | Replaces Save, Save & Next and Save as Draft, which were identical (develop `EnvironmentalOrderEnter.jsx`, `VectorOrderEnter.jsx`). |
| EV-A2 | **One transaction.** One Save covers the order header, the site create (EV-G3), the requester, compliance standards, program, collection conditions, samples, children (QC, organisms), pools, test assignments, receipt condition, storage, referrals, NCEs, attachments and label print requests. It is one server transaction; if any part fails, nothing is stored. The sampling-site create and the pool fan-out run inside it. | Fixes `resolveOrCreateSamplingSiteId` running before validation and outside `persistData`, and the per-sample storage calls on the Label step. |
| EV-A3 | **Connectivity, time and integrity:** clinical section K applies. That includes the server moment and the laboratory time zone (FR-K8 to K11) and the idempotent save (FR-K3 to K5). A failed lookup is never shown as "no results" (FR-K1, K2). | |
| EV-A4 | **Never stamp a blank date.** A blank collection or receipt date or time stays blank, and is listed on the To continue checklist when the complete level needs it. **Receipt** gets a visible default of the server moment (clinical FR-C3 pattern); **collection** never gets a default. Receipt is set once for the order and copied to every row; a row can override it for samples that arrived later (develop stores received date and time per row today). | Fixes `buildStampedSamples`. Audit item 8. |
| EV-A5 | **Cancel order**, a reason list, and no deletes: clinical FR-A4 applies. | MUST D. |
| EV-A6 | **Order progress status:** clinical FR-F5 applies with **Entered**, **Ready for testing** (Sample check on) and **Cancelled**. An order is complete when Enter Order is saved at the complete level with Sample check off, or at Ready for testing with it on. | Replaces vector's hard-coded "Processing" text. |
| EV-A7 | **Held tests, not held orders.** An order completes even when some tests are **On hold: awaiting customer instruction** (EV-E7). Held tests cannot be released for testing or resulted until the instruction is recorded; the rest of the order goes ahead. The dashboard shows a **Held tests** count on the order row and a **Has held tests** filter. | Critique R1. D-102. New data (Dependency 24). |
| EV-A8 | **Dashboard.** Clinical section H applies (FR-H1, H2, H2a filters and search, H3 editing through the steps, H4 split orders), with domain columns: **Sampling site** in place of Patient and no Facility column; Priority; Progress; Held tests (EV-A7); Last updated. Search covers lab number, field ID and site. Row actions keep today's: Continue, Accept (electronic orders), Fix issue. The Status filter includes Referred out; Priority and date filters stay. | Audit item 14. Existing `OrderDashboard.jsx`. |
| EV-A9 | **Leaving with unsaved changes.** Navigating away, closing the tab or switching domain with unsaved changes asks "Leave without saving? {count} changes on this page will be lost." with **Stay** and **Leave**. An untouched page never asks. Clinical should adopt the same rule. | Audit item 19. Fixes OGC-1051 (guard fires on an untouched form). |
| EV-A10 | **Saved order view.** A saved order opens read-only with **Edit** (clinical FR-H3); the barcode bar that loads an order by scanning its lab number stays; the order summary strip (clinical FR-B2) shows lab number, domain Tag, site, requester, program, compliance standard, received, number of samples or catches, and held tests. | Audit item 20. Existing `OrderWorkflowLayout.jsx`, `OrderContextCard`. |

### B. Environmental Enter Order

Sections in page order, matching the chain-of-custody form:

| ID | Requirement | Notes |
|---|---|---|
| EV-B1 | **Page order** (environmental): 1. Order details; 2. Site and requester; 3. **Order defaults**, a one-line summary of program, compliance standard, sampled by and collection conditions, which expands to edit (EV-B3, B4, B10); 4. **Samples** (section D); 5. Receipt condition (section E); 6. Labels (section L); 7. Attachments. **1. Order details:** lab number (clinical FR-A14), order date, received date and time (EV-A4), priority, requested completion date, and the requester's reference number. | Critique R4: the main work comes third. |
| EV-B2 | **2. Site and requester.** The **default sampling site** is found through EV-G. The **requesting organization and contact** keep the existing rule: at least one of the two, with phone and email captured (`errors.requester.org.or.requestor.required`). The site is the default for every sample row (EV-D3). | |
| EV-B3 | **Program and compliance** (inside Order defaults). Program (existing). **Compliance standards** are chosen with a multi-select picker over Environmental Compliance Standards (D-068), with **No standard (investigative)** as an explicit, exclusive option. The standard drives the limits results are judged against, and, once S-03e (OGC-768) is built, suggested tests; develop stores the chosen standards but has no suggestion logic yet. The order's standard is the default for every row; a row can use a different one, and a **Standard** column appears only when rows differ. Each standard shows its **decision rule** (how measurement uncertainty is treated when stating pass or fail), and the order records **Decision rule agreed with the customer** (Yes, or No with a note). | C-7. ISO/IEC 17025 7.1.3. Critique U9, I2. |
| EV-B3a | **Environmental culture tests.** An environmental **generic culture test** (for example "Environmental bacterial culture") is picked in the samples table like any other test. There is no Microbiology section and no Program coupling: ordering one does not set or lock Program (Microbiology v2 D-146, retiring D-131). On save, each sample with one opens a Microbiology Case; replicate swabs from one sampling point, collected together, share a Case, which the technician can split on the Case. Purpose and replicates for culture work are entered on the Microbiology Case, not here. | Owned by M-18 v0.8 FR-C1, FR-C4; `amr-micro-v2-amendments.md` draft 8 A-02 (D-124, D-129, D-138, D-146). |
| EV-B4 | **Collection conditions** (inside Order defaults): collection method, weather, preservation method (free text today, becoming a per-container value in phase 2 with Container Types), **water temperature**, **ambient temperature** and **field notes** (all three existing, optional; `ENV_WATER_TEMP`, `ENV_AMBIENT_TEMP`, `ENV_FIELD_NOTES`), and sampler name (new; no key exists today, Dependency 17). They are filled from the requester's or program's last order, shown visibly as "From last order 22 Sep", and copy into rows; a row can override them. | Existing observations `ENV_*`. Critique R3, X9. |
| EV-B5 | **Order defaults come from standing agreements.** The requester (or program) record in Locations & Organizations holds a **standing agreement**: the compliance standards normally used, the decision rule agreement (with date and who agreed), Sampled by, and any requested methods that differ from the laboratory's. A new order fills these from the agreement, shown as "From agreement with {requester}, agreed {date}". The user changes them only when this order differs; a change is recorded on the order. With no agreement, the fields are empty and the complete level asks for them. | Critique R3, X9. ISO/IEC 17025 7.1 (review of requests can rest on a standing agreement). D-103. New data (Dependency 23). |
| EV-B6 | The Order defaults summary reads, for example, "Drinking water quality monitoring · PNG Drinking Water Standard 2018 (agreed 14 Mar) · Sampled by customer · Grab, overcast". It opens when a required value is missing or the user chooses Edit. | Critique R4, X12. |
| EV-B7 | Receipt condition, Labels and Attachments follow the Samples section (EV-B1). | |
| EV-B8 | **Attachments.** The scanned chain-of-custody form and any other documents (existing attachments). | |
| EV-B9 | The environmental **Print Labels panel** with its Order, Sample, Slide, Block and Freezer buttons (none working) is removed. | |
| EV-B10 | **Sampled by.** An order-level choice inside Order defaults, filled from the standing agreement (EV-B5): **Customer** (default) or **Laboratory**. For Laboratory, the order records the sampling plan or procedure reference and the sampler. A row can override it (develop has a per-row "Lab performed sampling" checkbox today), for batches where the laboratory sampled some points and the customer others. The choice drives the report statement: for customer sampling, "Results apply to the sample as received". | ISO/IEC 17025 7.3, 7.8.2.1. Critique I3. Audit item 7. New data (Dependency 17). |
| EV-B11 | **Requested method.** Each ordered test shows the laboratory's method. Requested methods from the standing agreement (EV-B5) fill in automatically. When the customer asked for a different one (for example on the chain-of-custody form), the user records the requested method, and a difference is recorded as **Customer informed** (who and when). | ISO/IEC 17025 7.1.1. Critique I2. New data (Dependency 16). |
| EV-B12 | **Receiver.** The user who saves the receipt is recorded as the receiver, with **Chain-of-custody signed by receiver** (Yes or No) beside the attached form. | ISO/IEC 17025 7.5. Critique I7. |
| EV-B13 | **Program questionnaire** (environmental) stays as today inside Order defaults. **Remember site and requester** (clinical FR-B10) stays: a checkbox that keeps the site, requesting organization and contact for the next order, per user. | Audit items 3, 15. |
| EV-B14 | **Order-level non-conformity.** The page header keeps **Report non-conformity** for a problem that is not tied to one sample (for example an incomplete chain-of-custody form). Outcomes follow clinical FR-E4. | Audit item 13. |
| EV-B15 | **Requesting organization and contact are never edited from the order form.** The "Edit details" unlock on a selected organization or contact is removed, as for sites (EV-G2). A new organization or contact is created only after a successful search, inside the save; corrections are made in Locations & Organizations, linked from the field for users who can edit there. | Audit item 16. Same overwrite risk as EV-G2. |

### C. Vector Enter Order

| ID | Requirement | Notes |
|---|---|---|
| EV-C1 | **1. Order details.** As EV-B1. | |
| EV-C2 | **2. Program and requester.** Surveillance program, the submitting organization and contact (same rule as EV-B2), and the default sampling site (EV-G). The site is optional at the order level, because every catch row carries its own (EV-D3). The **program questionnaire** and the **Vector Field Survey panel** (house, container and pupae counts with the live house, container, Breteau and adult indices) stay exactly as today, optional, inside Order defaults. | Matches V-02: site optional at order level. Audit item 3; C-16. Existing `ProgramSection.jsx`, `VectorFieldSurveyPanel.jsx`. |
| EV-C3 | **Page order** (vector): 1. Order details; 2. Program and requester; 3. **Order defaults** (one-line summary: program, arrives as, collector, pass-through trap fields); 4. **Catches and pools** (section D); 5. Receipt condition (section E); 6. Labels; 7. Attachments. | Critique R4. |
| EV-C4 | **Arrives as at order level.** Order defaults hold **Arrives as** (Unsorted catch or Sorted pool) for the whole submission; each row inherits it and can override it. | Critique R8. |
| EV-C5 | Order defaults are filled from the program's last submission and its standing agreement, shown visibly (EV-B5 pattern). | Critique R3. |
| EV-C6 | The collector is never defaulted from the requester. When the submission doesn't name one, it stays blank or is set to "Collected by submitting program". | Fixes `collectorId: s.collectorId \|\| providerName`. |

### D. The samples table in environmental and vector

The shared samples table from clinical section C and section L is used here. Clinical FR-C1, C2a, C4a, C6 to C8, C10 and C11 apply as written. This section states the domain columns, the row kinds and the deltas.

| ID | Requirement | Notes |
|---|---|---|
| EV-D1 | **Row kinds.** **Environmental:** primary sample, QC Duplicate child, QC Blank (its own primary row tagged QC, optionally associated with the samples it covers), QC Control (its own row with an expected value), and aliquot. **Vector:** catch or pool row (a container), with its organism children collapsed beneath. | Clinical FR-L1. C-16. |
| EV-D2 | **Numbering** (C-1, C-6 as amended by C-13). A container is `{labNo}-{n}`; its children are `{labNo}-{n}.{m}`. An environmental duplicate of `-1` is `-1.1`. A blank is its own sample, for example `-3`. A vector sorted pool is `-1`, and its organisms are `-1.1` to `-1.{count}`, created at intake. An unsorted catch is `-1` with a count; its organisms are created when the bench sorts it (V-03) and are numbered the same way. The suffix badge and the heading follow clinical FR-C4a. Parent links always come from the data (the parent pointer or the pool), never from parsing a number. | Clinical FR-C4 extended to all domains (D-088). Fills the null organism `externalId`. |
| EV-D3 | **Where each sample came from.** Each row has a **Site** cell that defaults from the order's default site and can be changed with the EV-G search. The search covers **sampling sites** and **locations** from Locations & Organizations (ward, department, facility), shown as two groups, so a hospital surface swab points at the ward it came from. For environmental rows whose sample type is a **submitted object** (a food item, device or returned product), the site is optional; the row records **Object description** and **Source** (the submitter) instead. The default is filled visibly, never silently. The row shows the site's sampling point code when one is set. | C-9 item 1, C-11. New data: a row may point at a location (Dependency 21). |
| EV-D4 | **Field sample ID on every row.** An optional text cell, **Field ID**, holds the client's or submitter's own identifier, such as the bottle number on the chain-of-custody form or the program's pool ID. It is searchable, prints on labels (EV-L2) and on reports, and is exported. It is stored as the sample item's external reference, separate from the sample number. | C-9 item 2. New data (Dependency 3). |
| EV-D5 | **Environmental columns, always shown.** Select; Sample number (with Field ID and the kind Tag beneath); Site; Sample type and container in one cell (the existing "Sample Container" dictionary; Container Types in phase 2); Tests (Tags); **Collected** (date, time and sampler in one cell, clinical FR-C3 Fill all; a composite shows its start and end, EV-D14); **Time to test** (EV-F2); Preservation check (EV-E4); Storage (truncated from the left, full path on hover); Status Tags. **Standard** appears only when rows use different standards (EV-B3). | Critique U5, X1 layout. |
| EV-D6 | **Vector columns, always shown.** Select; Sample number (with Field ID and kind Tag beneath); Site; Arrives as, organism group and life stage in one cell; Species, sex and status in one cell (sorted pools only, EV-H2); **Count**; Tests; Collected (date, time, collector); Preservation check (only where needed, EV-E4); Storage; Status. Trap type, traps deployed and trap nights are optional pass-through fields in the expanded row (EV-H4). | C-4, C-8, critique R5. |
| EV-D7 | **Expanded row, optional detail only.** Environmental: collection method, weather and preservation method overrides; **location details** (free text such as "Inlet, east bank", existing); depth; sample notes; received date and time override (EV-A4); sampled by override (EV-B10); GPS; purpose (EV-M2). Vector: trap type, traps deployed, trap nights, **collection context** (time of day, resting context indoor, outdoor or peridomestic, human-biting catch; existing `VS_*` values, now per row), notes, GPS. **GPS** is shown as today (environmental rows always; not newly gated by `GPS_ENABLED`) and defaults from the site's coordinates, visibly; vector rows inherit the site's GPS as develop does. Required data never sits here (D-078). | Audit items 2, 4, 5, 6. C-16. |
| EV-D8 | **QC rows** (environmental). The toolbar has **Add blank** (a QC Blank primary row with the batch's tests preselected, and **Covers** to associate it with the rows it controls, default all rows of the same shipment) and **Add control** (a QC Control row with an **Expected value** per test). Each row's overflow has **Add duplicate** (a QC Duplicate child with the parent's tests). All write the S-08 QC profile (`qcType`, `parentSampleItemId`, `expectedValue`, and the blank's covered samples) in the same save. As today, the QC actions are enabled only when every selected test has a QC threshold set and at least one test has a numeric result; otherwise the tooltip says which test lacks a threshold. Laboratory method blanks and spikes stay at the bench. | C-5 as amended by C-16. Audit items 9, 10. Existing UI in `SampleTestSection.jsx:700-760`. |
| EV-D9 | **Fast batch entry.** The table works like a spreadsheet for data entry: cells are plain text until focused, and typing opens an inline typeahead (never a Carbon Select or ComboBox trapping Tab or Enter). Tab moves across cells, Enter commits and moves down, Escape cancels. **Paste** of rows copied from a spreadsheet fills cells across and down from the focused cell, showing a preview ("Paste 18 rows into Field ID, Site, Collected?") before it applies. **Copy row** and **Fill down** work on the selection (EV-D19). Scanning a client barcode into the Scan field adds a row with that Field ID, or selects the row that already has it. | Research E10, critique X1, X11. MVP (C-12). |
| EV-D10 | **Remove and void:** clinical FR-C7 applies. For a vector catch, voiding the catch voids its organisms and its pool with the same reason, and nothing is deleted. | D-002. |
| EV-D11 | **Chain-of-custody reconciliation.** A row can be marked **Listed, not received** (on the form, never arrived): it keeps its Field ID and tests, gets no sample number, and raises an NCE. A row can be flagged **Extra, not on chain-of-custody**. Both need a customer instruction (EV-E7) at the complete level, and both are stated on the report. | ISO/IEC 17025 7.4.1, 7.4.3. Critique I4. New data (Dependency 19). |
| EV-D12 | **Child kind always shown.** Every child row carries its kind Tag (Aliquot, QC Duplicate, Organism) next to the suffix badge, on every screen and label, and as a column in every export. | Critique U2. |
| EV-D13 | **Changing the default site.** Changing the order's default site updates only the rows still marked "From order". The user sees "Updated 4 rows. 2 rows with their own site were not changed." with **Undo**. | Critique U4. |
| EV-D14 | **Grab or composite.** Each environmental row has a sample kind: **Grab** (default, one moment) or **Composite** (collected over a period, for example a 24-hour wastewater composite), with a collection start and end. Holding time, reports and exports use the **end**. | Critique B1. ISO/IEC 17025 7.8.2.1. New data (Dependency 18). |
| EV-D15 | **Repeated field IDs.** When a Field ID already exists on an open order from the same requester in the last 30 days, the cell shows "BTL-07 was received on 26CPHL00488 on 12 Sep" with a link. It warns and never blocks. | Critique B3. |
| EV-D16 | **QC rows at the end.** QC rows sort after the client's samples by default, and the table can be sorted by any column. | Critique U3. |
| EV-D17 | **Large batches.** The table header and toolbar stay visible while scrolling, and a **Rows with problems** filter shows only the rows the To continue checklist names. The page works at 1024 px wide: optional columns move into the row expansion, and required columns stay on the row (D-078). | Critique X4, X5. |
| EV-D18 | **Compact single-line rows.** Every row is one line at Carbon's compact size. Cells show plain text until focused (a typeahead opens when the user types). Tests show as "3 tests" with the names in a popover and in the row expansion. Status shows as one icon plus one word. Target: 15 or more rows visible on a 1080 px screen. | Critique R5. |
| EV-D19 | **Toolbar and batch bar.** With nothing selected, the toolbar shows only **Add sample**, **Scan**, **Add blank** (environmental) and **Paste from spreadsheet**, plus the Rows with problems filter and sort. Selecting rows replaces it with the Carbon batch action bar: **Print labels**, **Store**, **Refer out**, **Report non-conformity**, **Record customer instruction**, **Assign to shipment**, **Copy row**, **Fill down**, **Remove**. This amends clinical FR-C8 for the shared table. | Carbon `TableBatchActions`. Critique X7. |
| EV-D20 | **Row icons.** Each row shows at most two icon buttons, **Print label** and **Report non-conformity**, and an overflow menu (Refer out, Add duplicate, Record customer instruction, Remove or Void). Every action is also one click from selection in the batch bar. Icon buttons are at least 32 px with a tooltip. | Carbon data table guidance (3 or fewer visible row actions). Amends D-078 (D-104). Critique X10, X14. |
| EV-D21 | **One signal per problem.** A problem shows once, on its row, as one icon and one word in the Status cell ("Warm", "Past hold", "Not received", "Held"), with the detail in a tooltip and the row expansion. Rows are not tinted. The receipt panel shows the measured value only; the To continue checklist links to the row. The prefilled NCE opens from the row, not as a separate panel. | Alarm fatigue. Critique X8. D-105. |
| EV-D22 | **Helper text on demand.** Explanations (decision rule, sampled-by statements, arrives as, time to test) sit behind an info icon; each is shown open the first time a user meets it and collapsed after that. | Critique X12. |
| EV-D23 | **Storage.** Clinical FR-E1 and E5 apply: the storage picker with position, move versus assign, and the lock rule. Each row keeps **Condition notes** (existing, per sample). **Skip storage for unassigned samples** stays as one order-level choice saved in the same transaction (clinical FR-K5, one storage-skipped record). The dashboard's Not stored filter stays (clinical FR-H1). | Audit item 11. Replaces the Label step storage block in `OrderLabel.jsx`. |
| EV-D24 | **Referral dispatch.** Clinical FR-E2, E3 and E3a apply: refer one or more rows with their tests, keep the subcontract and chain-of-custody fields (clinical FR-L4), then **Dispatch** after save, with the Subcontract status shown on the row. | Audit item 12. Replaces `OrderReferOutSection.jsx` on the Label step. |
| EV-D25 | **Panels on a row.** Each row can take panels as well as tests, with the clinical chooser rules (FR-B14 domain filter, FR-B16 panel integrity). | Audit item 23. |

### E. Condition on receipt (shared by both domains)

| ID | Requirement | Notes |
|---|---|---|
| EV-E1 | A **Receipt condition** panel sits above the samples table. It records one or more **shipments** (a cooler, box or bag). Each shipment has: **Temperature on receipt** (number, °C, one decimal), **Thermometer** (a picker over the laboratory's equipment list; a thermometer whose calibration is overdue shows "Calibration overdue since {date}" and can still be used with a note), **Ice or coolant present** (Yes, No, Not required), **Custody seals** (Intact, Broken, None), **Containers intact** (Yes, or No with which rows), and notes. Rows are assigned to a shipment by selecting them and choosing **Assign to shipment**; new rows join the last shipment used. When every value is in range the panel collapses to one line ("1 shipment, 4.1 °C, on ice, seals intact") and it opens by itself when anything is out of range. | C-9 item 3. ISO/IEC 17025 6.4. Critique U8, I6, X2. New data (Dependency 4, 20). |
| EV-E2 | **Acceptable range.** The temperature is judged against the acceptable range of the sample type (for example 0 to 6 °C for most chilled water tests; frozen for vector specimens on dry ice), set in Sample Type settings. The sample type can also set a **same-day cooling window** (for example 4 hours): a sample received within that window after collection, on ice or coolant, is **acceptable, cooling started**, not out of range, and the row notes it. Without a range, the temperature is recorded only. | New data on sample type (Dependency 5). EPA practice. Critique U6. |
| EV-E3 | **Out of range raises a problem.** A temperature outside range, a broken seal or a broken container marks the affected rows with a warning Tag and pre-fills a **Report non-conformity** entry for those rows, with the reason "Received outside acceptance conditions" and the measured value. To go on testing, the user records the customer's instruction (EV-E7). Each affected sample gets a **qualifier** from the qualifier list (EV-M7), for example "T: Received at 9.4 °C, above 6 °C", which prints on the report and travels in the export and FHIR. | Warn, don't wall (clinical principle 6). ISO/IEC 17025 7.4.3. |
| EV-E4 | **Preservation check per container.** The Preservation check cell appears only on rows whose container needs a check (critique R7); other rows leave it blank. **Environmental:** when the container needs chemical preservation, pH measured (number) and Acceptable (Yes or No), or **Checked at bench**; for volatile organic containers, headspace only (None, Bubble present), because those vials are never opened at receipt. **Vector:** the preservative as received (Dry ice, Ethanol, RNAlater, Silica, None). A failed check behaves as EV-E3. | Critique U7. |
| EV-E5 | Sample check (section J) shows the receipt condition beside its checklist items, so the reviewer sees the measured values (clinical FR-F3b pattern). The thermometer defaults to the last one this user chose. | Critique X9. |
| EV-E6 | Clinical may adopt the same panel later. It is designed as a shared component with no environmental or vector wording. | |
| EV-E7 | **Customer instruction.** Whenever a sample is unsuitable (outside receipt conditions, past its holding time, listed but not received, extra) and the laboratory wants to go on, the affected tests are put **On hold: awaiting customer instruction** and the order can still be saved and completed (EV-A7). **Record customer instruction** (from the row overflow, the batch bar or the checklist) opens one form for every selected problem ("Applies to -2, -3 and BTL-09"): **Customer contacted** (who, when, how, defaulting to the requester's contact), one **Instruction** for all (Proceed, Cancel the test, Send a new sample) with a per-row override, and a note. Proceed releases the hold and keeps the qualifier; the report carries "Results may be affected: {qualifier}". | ISO/IEC 17025 7.4.3. Critique I1, R1, R2. D-100, D-102. New data (Dependency 16, 24). |
| EV-E8 | **Stored cold.** A storage location that is a monitored cold-storage device shows its current status on the row. A temperature excursion on that device flags the samples stored in it for review. | ISO/IEC 17025 7.4.4. Critique I5. Links to the cold-storage module. |

### F. Holding time

| ID | Requirement | Notes |
|---|---|---|
| EV-F1 | **Anchor.** Holding time is always counted from **collection** date and time (the **end** for a composite), on every screen: intake, results and validation. If collection is blank, the Time to test cell reads "Needs collection time". | Fixes the receipt anchor in `dateUtils.js` versus the collection anchor in `SearchResultForm.jsx`. D-095. |
| EV-F2 | **Per test, visible at intake.** Each test's limit comes from the existing test holding-time setting (`test.timeHolding`). The row's **Time to test** cell (tooltip: "Holding time left") shows the shortest time remaining among its tests ("5 h 20 min left, Total coliform"), with the other tests in the tooltip. It turns warm-gray below 25 % remaining and red when exceeded, always with text and an icon. It refreshes once a minute; it is not a live region, and only a change into warning or exceeded is announced to screen readers. | C-9 item 4. Critique U5, X3. |
| EV-F3 | **Out of hold at receipt.** When a test is already past its limit at receipt, the row shows the red "Holding time exceeded" Tag and the test gets the qualifier "H: Received outside holding time". The user chooses **Proceed** (needs the customer instruction, EV-E7), **Reject the test** (NCE with reason), or **Ask for a new sample** (clinical rejection path). | Existing keys `holding.time.exceeded.*`. |
| EV-F4 | **Suggest priority.** When any test has less than 25 % of its holding time left at save, the order priority suggests **STAT** with a one-line reason. The user decides. | |
| EV-F5 | **Tests added later.** A test added to a saved order (for example after a phone call from the client) is checked against its holding time at that moment, and EV-F3 applies if it is already exceeded. | Critique B2. |

### G. Sampling sites

| ID | Requirement | Notes |
|---|---|---|
| EV-G1 | **Search first.** The site picker searches existing sites by name, code, system or permit ID, and sampling point code (clinical FR-B5 pattern). The new-site form keeps today's fields: name, code (auto-generated from the name, editable), site type, region, GPS and description, plus EV-G5. **Add new site "{name}"** appears only after a search has succeeded, and never when `restrictFreeTextSampSiteEntry` is on (then: "Ask an administrator to add this site in Sampling Sites"). | OGC-1161 empty state applies. |
| EV-G2 | **Never overwrite.** Choosing an existing site uses it read-only. The order form never changes an existing site's name, code, type or coordinates; the Unlock control is removed. A correction to a site is made in Sampling Sites admin. | Fixes the overwrite in `SamplePatientUpdateData.java:1126-1140`. |
| EV-G3 | **Create inside the save.** A new site entered on the form is created in the same transaction as the order (EV-A2). If the save fails, no site exists. | Fixes the create before validation. |
| EV-G4 | **Code clash.** When a new site's code matches an existing site with a different name, the form says "Code {code} is already used by {site name}" and offers **Use {site name}** or **Change code**. It never silently reuses the site. | Fixes `getByCode` reuse. |
| EV-G5 | **Regulatory identifiers on the site.** Sampling Sites admin and the new-site form gain two optional fields: **System or permit ID** (for example a public water system number or a discharge permit) and **Sampling point code**. They show in the site picker and export (EV-M3). | C-10. New data (Dependency 6). |
| EV-G6 | Environmental and vector sites are the same entity (`VectorSamplingSite`) and follow the same rules. | Registry note corrected. |
| EV-G7 | **Correcting a site.** Beside a chosen site, users who can edit Sampling Sites see **Correct in Sampling Sites** (opens the admin page in a new tab; the order picks up the change on return). Other users see **Report a site problem**, which adds a note to the order for an administrator. | Audit item 17. Replaces the Unlock control. |

### H. Vector catches, pools and organisms

| ID | Requirement | Notes |
|---|---|---|
| EV-H1 | **Arrives as.** Each vector row is one of: **Unsorted catch** (a trap's catch in one container; the bench sorts and re-pools it in V-03) or **Sorted pool** (a tube already sorted by the program, tested as received). Default: Unsorted catch. Helper text explains both on first use. | C-8. Critique X6. |
| EV-H2 | **Sorted pool fields.** Species (a picker over the vector species list, with **Other (as submitted)** and free text, flagged for bench identification), sex (Female, Male, Mixed, Unknown) and status (Unfed, Blood-fed, Gravid, Mixed, Unknown), as submitted. They are shown with an **As submitted** Tag on every screen, report and export until bench identification in V-03 confirms or replaces them; the submitted values are kept. | New data on the row (Dependency 7). Critique U10, B5. |
| EV-H3 | **Count and organisms.** Count is required at the complete level and must be 1 or more. On save, the row is the container sample `-n`. **Sorted pool:** one intake pool labelled `{labNo}-P{nn}` groups the row's organisms `-n.1` to `-n.{count}`, and the row's tests are ordered on the pool; with a count of 1 the organism is `-n.1` and there is no pool. **Unsorted catch:** only the count is stored, and the row's tests wait on the catch; organisms and pools are created when the bench sorts it (V-03). Each organism inherits the row's site, collection date, time and collector, life stage and pass-through fields. | C-6 as amended by C-13 (D-090, D-098). Replaces the hard delete in `VectorPoolFanOutServiceImpl.java:135-146` and avoids creating hundreds of records for large catches. |
| EV-H4 | **Pass-through field data.** Trap type, traps deployed, trap nights and the collection context (EV-D7) are optional. They are stored **per row**, never copied from the first row, and never required. | C-8, C-16. Fixes the first-row copy in `OrderContext.jsx:893-910`. |
| EV-H5 | **Display.** A catch or pool row is collapsed by default and reads "25 mosquitoes, pool -P01". Expanding it lists the organisms by number, each with its storage, and a Print labels action for them. Pool labels (`-P01`, and later `-P01-S1` from V-03) are shown with a **Pool** Tag and are never called samples. | Clinical FR-L1 pool group row. |
| EV-H6 | **Same organism group per pool.** A pool cannot mix sample types (mosquito and flea); the existing homogeneity rule is applied at intake too, with the message "A pool holds one kind of organism". | Existing rule in `VectorDeconvolutionServiceImpl`. |
| EV-H7 | **Pool size.** The organism group, or the program, can set a maximum pool size (for example 50 mosquitoes). A sorted pool above it shows a warning, and saving is still allowed. | Critique B4. New data (Dependency 7). |
| EV-H8 | **Biosafety note.** When the organism group or program has a biosafety note (for example "May carry live virus, open in the biosafety cabinet"), it shows in the receipt panel and prints on the label. | Critique B6. |

### I. Required levels

Clinical FR-A7 to A10 apply. The sets per domain:

| ID | Level | Environmental | Vector |
|---|---|---|---|
| EV-I1 | **Save** (park the work) | A lab number; a requesting organization or contact; at least one sample row | A lab number; a submitting organization or contact; at least one catch or pool row |
| EV-I2 | **Complete** (finish or go to Sample check) | The save level, plus: a **compliance standard** or "No standard (investigative)" (C-7), with the decision rule agreement recorded (EV-B3, usually filled from the standing agreement, EV-B5); **Sampled by** (EV-B10, likewise); for every row, a site (or, for a submitted object, an object description and source), sample type, container, collection date and time (start and end for a composite), and at least one test; a receipt date and time; a temperature on receipt for every shipment that holds a row whose sample type has a receipt range (critique R6); every failed receipt or preservation check given an NCE (its customer instruction may follow later, as a held test, EV-A7); every test past its holding time given a choice under EV-F3; the collection method (order-level or row) | The save level, plus: for every row, a site, sample type, **Arrives as**, count of 1 or more, collection date, and at least one test; a receipt date and time; temperatures, failed checks and exceeded holding times handled as for environmental; customer instructions may follow as held tests |
| EV-I3 | Required markers follow clinical FR-A8. The To continue checklist is a sticky panel beside the footer showing a count ("5 items to continue"); it expands on click, names rows by suffix and field ID ("Collection time for -3 (BTL-07)"), and when four or more rows miss the same field it groups them ("Collection time for 18 rows"). | Critique X13. |
| EV-I4 | The validation text for a missing test says "Add at least one test to {suffix}", never "add a sampling site and sample type". | | Fixes OGC-1060. |

### J. Sample check

| ID | Requirement | Notes |
|---|---|---|
| EV-J1 | Sample check is shown when `sampleAcceptCheck.environmental` (or `.vector`) is Mandatory or Optional, and hidden, including from the progress indicator, when it is Off. This is clinical FR-F1 and F2 with the domain's own existing key. | Reuses existing settings; no new property. |
| EV-J2 | Layout and actions follow clinical FR-F3, F3b and F4: one expandable row per container, checklist items beside the recorded data they ask about, plus the receipt condition (EV-E5), time to test (EV-F2), and the **site details** develop shows today (name, code, type, region, zone, contact, phone, GPS, description) as identity evidence. The primary action is **Release for testing**; held tests (EV-A7) stay held and are listed as "Held: awaiting customer instruction". | Critique R1. |
| EV-J3 | For vector, a row is a catch or pool; its organisms are listed in the expansion, not checked one by one. | |
| EV-J4 | The setting's help text in Admin explains the split: Enter Order records, and Sample check is a second person verifying. For a laboratory with one person at reception, Off is recommended. | Critique U11. |

### K. Defects fixed by this design (reference list)

These are covered by the requirements above and listed for the reviewer. Every one was confirmed on develop 44dbc44.

| Defect | Where | Fixed by |
|---|---|---|
| Site created before validation, outside the transaction | `SamplePatientUpdateData.java:1119-1165`, controller line 361 vs 389 | EV-A2, EV-G3 |
| Order form overwrites an existing site | same file, 1126-1140; Unlock in `VectorSection.jsx` | EV-G2 |
| Same code, different name silently reused | same file, 1152-1155 | EV-G4 |
| Blank dates stamped "now" | `buildStampedSamples` | EV-A4 |
| Holding time anchored on receipt at intake | `dateUtils.js:92-117` | EV-F1 |
| Storage saved per sample; notes patched per sample; storage-skipped fire-and-forget | `OrderLabel.jsx:569-691`, 97-110 | EV-A2 (Label step removed) |
| Refer out as a second full save | `OrderReferOutSection.jsx:69` | EV-A2 |
| Save as Draft identical to Save | `EnvironmentalOrderEnter.jsx:216-228`, `VectorOrderEnter.jsx:136-195` | EV-A1 |
| Print Labels panel does nothing | `EnvironmentalOrderEnter.jsx:309-366` | EV-B9, section L |
| Vector trap fields copied from the first row | `OrderContext.jsx:893-910` | EV-H4 |
| Collector defaults to requester | `OrderContext.jsx:875-889` | EV-C6 |
| Fan-out hard-deletes the parent | `VectorPoolFanOutServiceImpl.java:135-146` | EV-H3 (D-002) |
| Organisms have no sample number | same service, 57-73 | EV-D2, EV-H3 |
| Vector: test not required, dead `vecOrganismGroupId` condition | `VectorOrderEnter.jsx:114-132` | EV-I2 |
| "Processing" status is display-only text | `VectorOrderComplete.jsx:58-77` | EV-A6 |

### L. Labels

| ID | Requirement | Notes |
|---|---|---|
| EV-L1 | Labels follow clinical section I (the Labels section, every active preset, test catalog defaults, overrides within limits, no label tracking), scoped to the domain's presets. The section collapses to a one-line summary ("46 labels: 40 sample, 6 order") with **Print all**, and expands to edit quantities. | Clinical FR-I1 to I9. Critique R9. |
| EV-L2 | A sample label shows the sample number (text and barcode), the field ID when present, the site code, the collection date, and a QC Tag for QC rows. An organism label shows its number and the catch number. A pool label shows the pool label and its organism count. | |
| EV-L3 | For a vector row, **Print labels** offers "Catch label" (or "Pool label"), and, for a sorted pool, "Organism labels ({count})". Organism labels are never printed by default. The count follows the preset maximum and override rules. | Critique U1. |

### M. Regulatory data and export presets

| ID | Requirement | Notes |
|---|---|---|
| EV-M1 | **Identifiers captured at intake:** system or permit ID and sampling point code (from the site, EV-G5), field ID (EV-D4), QC type (EV-D8), compliance standard (EV-B3), receipt qualifiers (EV-E3), hold qualifiers (EV-F3), and sample purpose (EV-M2). | C-10. |
| EV-M2 | **Sample purpose** (environmental): Routine, Repeat, Confirmation, Special or investigative. Default Routine. A **Repeat** or **Confirmation** sample links to the **original sample** it follows up, chosen with a search by sample number or field ID. The link shows on both samples. | Promoted from phase 2 (C-10). New data (Dependency 8). |
| EV-M2a | **Culture samples use the culture purpose.** On a sample that opens a Microbiology Case, EV-M2's sample purpose is not shown; the Case's culture purpose is used instead, entered on the Case and defaulting to Routine monitoring (M-18 FR-C5, FR-C5a; Microbiology v2 A-03, D-137). | M-18 crosscheck X-08. |
| EV-M3 | **Export source fields.** The Custom Data Export sample-testing source gains the environmental and vector fields: domain, site name and code, system or permit ID, sampling point code, field ID, QC type and parent sample, compliance standard, sample purpose and original sample, receipt qualifiers, hold status and qualifier, method, result qualifiers. Vector adds: arrives as, organism group, species, sex and status as submitted, count, pool label, pool size and pool result. | Extends `SampleTestingSource`. Dependency 9. |
| EV-M4 | **Shipped presets.** Two saved report definitions ship as distribution configuration (`reporting-sources/*.json`, loaded by the existing configuration handler): **Environmental results (regulatory)**, with one row per result and the columns above, and **Vector pool results**, with one row per pool result, including pool size for infection-rate work. A laboratory adapts them to a national template by copying and editing the preset. Nothing is coded per country. | C-10. |
| EV-M5 | The presets respect the domain filter and the existing Custom Data Export access. They never include patient fields. | |
| EV-M6 | A separate design for **expanded reporting** is queued after this feature. It covers submission logs, validation against a regulator's rules and resubmission. | Out of scope here. |
| EV-M7 | **Qualifier list.** Qualifiers come from a configurable list (a dictionary category), each with a code and text, seeded with **H** (holding time exceeded), **T** (temperature outside receipt range), **P** (preservation not acceptable), **C** (chain-of-custody discrepancy) and **B** (analyte found in the associated field blank). Reports print code and text; the presets export the code. | Critique B7. New data (Dependency 14). |
| EV-M8 | **QC stays off client reports.** QC Blank and QC Duplicate rows are left off the client report and out of site statistics by default. They appear in a separate QC section of the report when the laboratory's report setting includes it, and always in the QC evaluation (S-08). | Critique U3. D-099. |

### N. Configuration preserved

| Setting | Effect kept | Where |
|---|---|---|
| `sampleAcceptCheck.environmental`, `sampleAcceptCheck.vector` | Mandatory, Optional or Off; Off now also hides Sample check | EV-J1 |
| `restrictFreeTextSampSiteEntry` | No new sites from the order form | EV-G1 |
| `GPS_ENABLED`, `GPS_ACCURACY_METERS`, `GPS_TIMEOUT_SECONDS` | GPS capture on rows | EV-D7 |
| Pre-printed accession setting, `validateAccessionNumber` | Lab number format | Clinical FR-A14 |
| Label presets and test label defaults | Labels | Section L |
| Environmental Compliance Standards | Suggested tests, limits | EV-B3 |
| Test holding time (`test.timeHolding`) | Time to test cell | EV-F2 |

---

## Information & Data

### Reused as is

- **Sample, SampleItem:** `externalId` carries the sample number; `parentSampleItem` links children.
- **`VectorSamplingSite`**, used by both domains.
- **`VectorPool`:** `parentPool`, `externalId` label.
- **`SampleItemQcProfile`:** `qcType`, `parentSampleItemId`, `expectedValue`.
- **Observations** `ENV_*` and `VS_*`, now written per sample where the row carries the value.
- **Dictionaries:** "Sample Container", "Env Collection Method", "Env Weather" (seeded by OGC-1182).
- **Other reused data:** Environmental Compliance Standards, test holding time, sample storage, Referral, NCE, label presets, and Custom Data Export saved definitions.

### New data (each declared as a Dependency)

- Field sample ID on each sample item (Dependency 3).
- Receipt shipment record: temperature, thermometer, coolant, seals, integrity, with rows assigned (Dependency 4).
- Sample type acceptable receipt range (Dependency 5).
- Site system or permit ID and sampling point code (Dependency 6).
- Vector row: arrives as, species, sex and status as submitted, and the trap fields per row (Dependency 7).
- Sample purpose and original-sample link (Dependency 8).
- Result and sample qualifiers for receipt and hold (Dependency 10), from a qualifier list (Dependency 14).
- Same-day cooling window on the sample type (Dependency 5).
- Requested method per test, decision rule agreement, and the customer instruction record (Dependency 16).
- Sampled by, sampling plan reference and sampler (Dependency 17).
- Grab or composite, with collection start and end (Dependency 18).
- Row status "Listed, not received" and the "Extra" flag (Dependency 19).
- Thermometer from the equipment list with calibration status (Dependency 20).
- A sample row may point at a location (ward, department, facility) instead of a sampling site; object description and source for submitted objects (Dependency 21).

### Lifecycle

**Sample.** A sample is saved at Entered and becomes Ready for testing through Sample check, or is complete with Sample check off. It can be voided with a reason and is never deleted.

**Vector catch.** The catch sample, its organisms and its pool are created together in one save. Voiding the catch voids all three.

**QC child.** A QC child follows its parent's order status but keeps its own sample status.

### Uniqueness

- **Sample numbers** are unique within the order and derived from the lab number.
- **Pool labels** are unique within the order.
- **Field ID** is not unique. It is the submitter's value and may repeat across orders.
- **Site code** is unique; see EV-G4 for clashes.

---

## Access

Accessible via existing roles; no new permission names.

- **Reception** enters and saves environmental and vector orders, records the receipt condition, adds QC rows, prints labels, cancels an order, and can refer out (clinical Access rule for referral).
- **Sample check** is completed by the role holding sample acceptance today. Others see it read-only.
- **New sites from the order form:** Reception can create them unless `restrictFreeTextSampSiteEntry` is on. System or permit ID and sampling point code are edited in Sampling Sites admin by Admin; on the order form they are editable only on a new site.
- **Sample type receipt range:** set by Test Catalog Manager and Admin.
- **Custom Data Export presets:** run by the roles that can run Custom Data Export today. Editing or copying a preset follows the same access.

- **Customer instructions** (EV-E7), requested methods and the decision rule agreement are recorded by Reception or anyone who can edit the order.
- **Qualifier list** and the **same-day cooling window**: Admin and Test Catalog Manager.

Customer instructions, voids and cancellations are recorded with user, time and reason.

---

## Localization

REUSE keys were verified in `frontend/src/languages/en.json` at 44dbc44. The shared footer, checklist, table and label keys are those in the clinical FRS Localization table and are not repeated. NEW keys use `order.env.*`, `order.vector.*`, `order.receipt.*`, `order.hold.*` and `reporting.preset.*`.

| Key | English | Context | Reuse |
|---|---|---|---|
| `vector.order.samplingSite` | Sampling Site | Site picker, column | REUSE |
| `vector.order.site.add.new` | + Add new site "{name}" | Site picker | REUSE |
| `vector.order.site.no.match` | No matching site found. | Site picker | REUSE |
| `env.complianceStandards.label` | Compliance Standards | Section | REUSE |
| `env.collectionMethod` | Collection Method | Conditions, row | REUSE |
| `env.weather` | Weather | Conditions | REUSE |
| `env.preservationMethod` | Preservation Method | Conditions | REUSE |
| `vector.trapType` | Trap Type | Expanded row | REUSE |
| `vector.trapNights` | Nights Deployed | Expanded row | REUSE |
| `vector.lifecycleStage` | Lifecycle Stage | Column | REUSE |
| `qc.type.blank` | QC: Blank | Tag | REUSE |
| `qc.type.duplicate` | QC: Duplicate | Tag | REUSE |
| `qc.add.blank` | + Blank QC | Toolbar | REUSE |
| `label.type.pool` | Pool of {count} {animal} | Pool row | REUSE |
| `holding.time.exceeded.title` | Holding Time Exceeded | Tag, dialog | REUSE |
| `sample.holdingLimit` | Holding time: {limit} | Tooltip | REUSE |
| `common.sampleType` | Sample Type | Column | REUSE |
| `common.tests` | Tests | Column | REUSE |
| `order.env.fieldId` | Field ID | Column | NEW |
| `order.env.fieldId.helper` | The client's or submitter's own ID for this sample | Helper | NEW |
| `order.env.site.default` | Default sampling site | Section | NEW |
| `order.env.site.rowDefault` | From order | Site cell hint | NEW |
| `order.env.compliance.none` | No standard (investigative) | Compliance option | NEW |
| `order.env.addDuplicate` | Add duplicate | Row action | NEW |
| `order.env.purpose` | Purpose | Expanded row | NEW |
| `order.env.purpose.routine` | Routine | Option | NEW |
| `order.env.purpose.repeat` | Repeat | Option | NEW |
| `order.env.purpose.confirmation` | Confirmation | Option | NEW |
| `order.env.purpose.special` | Special or investigative | Option | NEW |
| `order.env.purpose.original` | Original sample | Link field | NEW |
| `order.env.site.codeClash` | Code {code} is already used by {site} | Site form | NEW |
| `order.env.site.useExisting` | Use {site} | Site form | NEW |
| `order.env.site.correct` | Correct in Sampling Sites | Site link | NEW |
| `order.env.site.report` | Report a site problem | Site link | NEW |
| `order.env.addControl` | Add control | Toolbar | NEW |
| `order.env.blank.covers` | Covers | Blank row field | NEW |
| `order.env.control.expected` | Expected value | Control row field | NEW |
| `order.env.waterTemp` | Water temperature | Conditions (existing field, reuse key if present) | NEW |
| `order.env.ambientTemp` | Ambient temperature | Conditions (existing field, reuse key if present) | NEW |
| `order.env.fieldNotes` | Field notes | Conditions (existing field, reuse key if present) | NEW |
| `order.env.locationDetails` | Location details | Row expansion (existing field, reuse key if present) | NEW |
| `order.nav.leave.title` | Leave without saving? | Leave prompt | NEW |
| `order.nav.leave.body` | {count} changes on this page will be lost. | Leave prompt | NEW |
| `order.env.site.restricted` | Ask an administrator to add this site in Sampling Sites | Site picker | NEW |
| `order.vector.arrivesAs` | Arrives as | Column | NEW |
| `order.vector.arrivesAs.catch` | Unsorted catch | Option | NEW |
| `order.vector.arrivesAs.pool` | Sorted pool | Option | NEW |
| `order.vector.count` | Count | Column | NEW |
| `order.vector.species` | Species (as submitted) | Column | NEW |
| `order.vector.sex` | Sex | Column | NEW |
| `order.vector.status` | Status | Column | NEW |
| `order.vector.rowSummary` | {count} {organism}, pool {pool} | Collapsed row | NEW |
| `order.vector.collectorProgram` | Collected by submitting program | Collector option | NEW |
| `order.vector.poolMixed` | A pool holds one kind of organism | Validation | NEW |
| `order.vector.labels.catch` | Catch label | Print menu | NEW |
| `order.vector.labels.organisms` | Organism labels ({count}) | Print menu | NEW |
| `order.receipt.title` | Condition on receipt | Panel | NEW |
| `order.receipt.shipment` | Shipment {n} | Panel row | NEW |
| `order.receipt.temperature` | Temperature on receipt (°C) | Field | NEW |
| `order.receipt.thermometer` | Thermometer | Field | NEW |
| `order.receipt.coolant` | Ice or coolant present | Field | NEW |
| `order.receipt.seals` | Custody seals | Field | NEW |
| `order.receipt.intact` | Containers intact | Field | NEW |
| `order.receipt.outOfRange` | Received at {value} °C, outside {min} to {max} °C | Qualifier, Tag | NEW |
| `order.receipt.nceReason` | Received outside acceptance conditions | NCE reason | NEW |
| `order.receipt.preservation` | Preservation check | Column | NEW |
| `order.receipt.ph` | pH | Field | NEW |
| `order.receipt.headspace` | Headspace | Field | NEW |
| `order.hold.column` | Time to test | Column | NEW |
| `order.hold.tooltip` | Holding time left | Column tooltip | NEW |
| `order.hold.left` | {time} left, {test} | Time to test cell | NEW |
| `order.hold.needsCollection` | Needs collection time | Time to test cell | NEW |
| `order.hold.receivedOut` | Received outside holding time | Qualifier | NEW |
| `order.hold.suggestStat` | Less than a quarter of the holding time is left for {test}. Mark as STAT? | Priority hint | NEW |
| `order.continue.addTest` | Add at least one test to {suffix} | Checklist | NEW |
| `order.env.standard.row` | Standard | Column (shown when rows differ) | NEW |
| `order.env.decisionRule` | Decision rule | Compliance section | NEW |
| `order.env.decisionRule.agreed` | Decision rule agreed with the customer | Field | NEW |
| `order.env.sampledBy` | Sampled by | Field | NEW |
| `order.env.sampledBy.customer` | Customer | Option | NEW |
| `order.env.sampledBy.lab` | Laboratory | Option | NEW |
| `order.env.sampledBy.plan` | Sampling plan or procedure | Field | NEW |
| `order.env.sampledBy.statement` | Results apply to the sample as received | Report statement | NEW |
| `order.env.requestedMethod` | Requested method | Test row | NEW |
| `order.env.customerInformed` | Customer informed | Field | NEW |
| `order.env.cocSigned` | Chain-of-custody signed by receiver | Field | NEW |
| `order.env.kind.grab` | Grab | Option | NEW |
| `order.env.kind.composite` | Composite | Option | NEW |
| `order.env.composite.start` | Collection start | Field | NEW |
| `order.env.composite.end` | Collection end | Field | NEW |
| `order.env.object.description` | Object description | Field | NEW |
| `order.env.object.source` | Source | Field | NEW |
| `order.env.site.groupSites` | Sampling sites | Picker group | NEW |
| `order.env.site.groupLocations` | Locations | Picker group | NEW |
| `order.env.site.cascade` | Updated {count} rows. {kept} rows with their own site were not changed. | Toast | NEW |
| `order.env.coc.notReceived` | Listed, not received | Row status | NEW |
| `order.env.coc.extra` | Extra, not on chain-of-custody | Row flag | NEW |
| `order.env.fieldId.repeat` | {fieldId} was received on {order} on {date} | Warning | NEW |
| `order.table.problemsOnly` | Rows with problems | Filter | NEW |
| `order.table.paste.preview` | Paste {rows} rows into {columns}? | Paste preview | NEW |
| `order.table.copyRow` | Copy row | Toolbar | NEW |
| `order.table.fillDown` | Fill down | Toolbar | NEW |
| `order.kind.aliquot` | Aliquot | Kind Tag | NEW |
| `order.kind.organism` | Organism | Kind Tag | NEW |
| `order.receipt.assign` | Assign to shipment | Toolbar | NEW |
| `order.receipt.summary` | {count} shipment, {temp} °C, {coolant}, seals {seals} | Collapsed panel | NEW |
| `order.receipt.coolingStarted` | Acceptable, cooling started | Row note | NEW |
| `order.receipt.calibrationOverdue` | Calibration overdue since {date} | Thermometer warning | NEW |
| `order.receipt.checkedAtBench` | Checked at bench | Preservation option | NEW |
| `order.customer.title` | Customer instruction | Panel | NEW |
| `order.customer.contacted` | Customer contacted | Field | NEW |
| `order.customer.instruction` | Instruction | Field | NEW |
| `order.customer.proceed` | Proceed | Option | NEW |
| `order.customer.cancelTest` | Cancel the test | Option | NEW |
| `order.customer.newSample` | Send a new sample | Option | NEW |
| `order.customer.awaiting` | Awaiting customer instruction | Row status | NEW |
| `order.customer.statement` | Results may be affected: {qualifier} | Report statement | NEW |
| `order.vector.asSubmitted` | As submitted | Tag | NEW |
| `order.vector.speciesOther` | Other (as submitted) | Species option | NEW |
| `order.vector.poolTooLarge` | This pool holds {count}, above the usual maximum of {max} | Warning | NEW |
| `order.vector.labels.pool` | Pool label | Print menu | NEW |
| `order.vector.biosafety` | Biosafety | Receipt panel | NEW |
| `order.defaults.title` | Order defaults | Section | NEW |
| `order.defaults.fromAgreement` | From agreement with {requester}, agreed {date} | Default hint | NEW |
| `order.defaults.fromLast` | From last order {date} | Default hint | NEW |
| `order.hold.awaitingCustomer` | On hold: awaiting customer instruction | Test status | NEW |
| `order.hold.heldTests` | Held tests | Dashboard column | NEW |
| `order.hold.filter` | Has held tests | Dashboard filter | NEW |
| `order.customer.appliesTo` | Applies to {rows} | Instruction form | NEW |
| `order.status.warm` | Warm | Row status word | NEW |
| `order.status.pastHold` | Past hold | Row status word | NEW |
| `order.status.notReceived` | Not received | Row status word | NEW |
| `order.status.held` | Held | Row status word | NEW |
| `order.tests.count` | {count} tests | Tests cell | NEW |
| `order.continue.count` | {count} items to continue | Sticky checklist | NEW |
| `order.continue.grouped` | {field} for {count} rows | Grouped checklist item | NEW |
| `order.labels.summary` | {total} labels: {sample} sample, {order} order | Collapsed labels | NEW |
| `reporting.preset.envRegulatory` | Environmental results (regulatory) | Preset name | NEW |
| `reporting.preset.vectorPools` | Vector pool results | Preset name | NEW |

---

## Dependencies

1. **Clinical Order Entry v4 MVP slices M1, M4 and M5** (idempotent save, the one-save pattern, footer and required levels) land first or together, because every domain saves through `persistData`.
2. **Clinical phase 2, P1 (Container Types) and P7 (samples table)**, before the phase 2 adoption here. The environmental "Sample Container" dictionary and preservative move into Container Types with P1.
3. **Field sample ID** on each sample item: new column, searchable.
4. **Receipt shipment record**: new entity with rows assigned.
5. **Sample type acceptable receipt range**: new setting in Sample Type settings.
6. **Sampling site system or permit ID and sampling point code**: two new optional fields on `VectorSamplingSite`, plus the admin form.
7. **Vector row fields**: arrives as, species, sex and status as submitted, and trap fields per row. Stored per sample item, not as order-level observations.
8. **Sample purpose and original-sample link**: new fields on the sample item.
9. **Custom Data Export source extension** (EV-M3) and two shipped preset JSON files.
10. **Sample and result qualifiers**, for receipt and hold. These must print on the report, travel in the export and map to FHIR (`Specimen.condition` for receipt; `Observation.note` or an interpretation for the result). Coordinate with V-04 and the results work.
11. **Dictionary seeds (OGC-1182)** and the Sampling Sites empty state (OGC-1161), so the required fields can be filled on a fresh install.
12. **Thermometer list**: reuse the cold-storage device list if it fits; otherwise free text until one exists.
13. **V-03 and V-04 alignment**: the pool labels (`-P01`, `-S1`) and organism numbers (`-n.m`) replace the `LABNO.X-Y` wording in V-03 FR-V03-DEC-006, results-entry-v4 FR-I2, the style guide and env-vector-workflows. The FHIR Specimen graph (V-04) uses the new organism identifiers.
14. **Qualifier list**: a dictionary category with code and text, seeded (EV-M7). Coordinate with results entry and the patient report redesign (OGC-1111) so qualifiers print.
15. **Report statements**: the report prints receipt and sampling dates (and the composite period), "Results apply to the sample as received" for customer sampling, and "Results may be affected" statements (EV-B10, EV-E7). Coordinate with OGC-1111.
16. **Request review data**: requested method per test, decision rule on each compliance standard with the agreement on the order, and the customer instruction record (who, when, how, instruction, note).
17. **Sampled by** on the order, with sampling plan reference and sampler.
18. **Composite** collection start and end on the sample item.
19. **Chain-of-custody reconciliation**: a row status for listed but not received, and an extra flag.
20. **Thermometer and calibration**: the receipt thermometer comes from the equipment list with calibration due date (the analyzer and equipment work); Dependency 12 becomes this.
21. **Location on a sample**: a sample item can reference a Locations & Organizations location (ward, department, facility) instead of a sampling site; object description and source fields. Coordinate with the Locations & Organizations redesign.
22. **Lab unit domains (D-120, superseding D-094)**: the chooser's Lab unit filter in environmental and vector order entry lists lab units of the order's domain (each lab unit has exactly one domain) (clinical FR-B14, Dependency 33).
23. **Standing agreement on the requester or program** (Locations & Organizations): usual compliance standards, decision rule agreement (who, when), sampled by, requested methods. Coordinate with the Locations & Organizations redesign.
24. **Test hold state**: a test-level hold "Awaiting customer instruction" that blocks release for testing and resulting until released, with the dashboard count and filter (EV-A7). Coordinate with results entry and the clinical order status (FR-F5).

---

## Superseded positions and proposed decisions

Highest decision in the repository copy was D-087 on 2026-09-27 (D-085 to D-087 are Document Library and Results Entry decisions). D-093 and D-094 are the domain switcher and lab unit domains from Clinical FRS v0.9. The IDs below are provisional; re-check before writing.

| Earlier position | Source | Replaced by |
|---|---|---|
| Environmental three-step wizard (Enter, Label, QA) | Environmental Order Entry v2 §5.2, §5.3 | Enter Order plus optional Sample check (EV-A, section J) |
| Vector four steps (Enter, Label, QA, Complete) | V-02 as built | Enter Order plus optional Sample check |
| Deconvolution numbering `LABNO.X-Y` | V-03 v1.2, results-entry-v4 FR-I2 | Containers `-n` and `-n.m`; pools `-P01`, `-S1` (EV-D2) |
| D-082 numbering, clinical only | Decision log | GLOBAL for containers (D-088) |
| Fan-out deletes the collected row | develop | The catch is the sample (EV-H3) |
| Site plus Compliance Standard required at save | OGC-1068 body | Compliance standard at the complete level (EV-I2) |
| Holding time from receipt at intake | develop | From collection everywhere (EV-F1) |
| Organisms created for every catch at intake | C-6 (2026-09-26) | Created at sorting for unsorted catches; at intake for sorted pools (EV-H3, D-098) |
| Proceed past an unsuitable sample with a recorded deviation | FRS v0.1 EV-E3, EV-F3 | Customer instruction recorded (EV-E7, D-100) |
| Customer instruction required before the order can be completed | FRS v0.3 EV-E7, EV-I2 | Affected tests held; order completes (EV-A7, D-102) |
| Decision rule, sampled by and requested method asked on every order | FRS v0.3 EV-B3, B10, B11 | Filled from the standing agreement (EV-B5, D-103) |
| Up to five row icons always visible (D-078 reading) | FRS v0.3, clinical FR-C6 | Two icons plus overflow, batch bar on selection (EV-D19, D-104) |

| Provisional ID | Decision | Scope |
|---|---|---|
| D-088 | Sample numbers in every domain: a container is `{labNo}-{n}`, its children `{labNo}-{n}.{m}`. Vector pools are labelled groups (`{labNo}-P{nn}`, sub-pools `-S{n}`), never numbered as samples. Parent links come from data, never from parsing. Supersedes D-082's clinical scope. | GLOBAL |
| D-089 | Environmental and vector order entry have one working step, Enter Order with the samples table always shown, plus the optional Sample check. | FEATURE |
| D-090 | The container is the sample: a vector catch or submitted pool is a sample and its organisms are children; fan-out never deletes. | GLOBAL |
| D-091 | Order entry records what the laboratory receives; upstream field operations data is not newly captured, and the field data develop already captures (field survey, collection context, field measurements) stays as optional pass-through. | FEATURE |
| D-092 | Condition on receipt is recorded as measured values on a shared component; out-of-range values raise an NCE and a report qualifier. | GLOBAL |
| D-095 | Holding time is counted from collection on every screen, with each test's limit from the test catalog. | GLOBAL |
| D-096 | A sampling site is created only after a successful search, inside the order transaction, and is never edited from the order form. | FEATURE |
| D-097 | Regulatory exports ship as Custom Data Export presets in distribution configuration; national formats are configured, not coded. | GLOBAL |
| D-098 | Organisms from an **unsorted catch** are created when the bench sorts it; a sorted pool's organisms are created at intake. Amends D-090 for unsorted catches. | FEATURE |
| D-099 | **QC rows never reach client reports or site statistics by default**; they appear in a QC section when the laboratory chooses, and always in QC evaluation. | GLOBAL |
| D-100 | **Going on with an unsuitable sample records the customer's instruction** (who was contacted, when, how, and the instruction); a recorded deviation alone is not enough. ISO/IEC 17025 7.4.3. | GLOBAL |
| D-101 | A sample's origin can be a **sampling site or a location** from Locations & Organizations (ward, department, facility); a submitted object needs neither and records its description and source. | GLOBAL |
| D-102 | An **unsuitable-sample hold applies to the affected tests, not the order**; the order completes, and held tests cannot be released or resulted until the customer instruction is recorded. Amends EV-E7 and EV-I2 of v0.3. | GLOBAL |
| D-103 | **Standing agreements live on the requester or program** (usual standards, decision rule agreement, sampled by, requested methods) and fill each order visibly; the order records only differences. | GLOBAL |
| D-104 | **Amends D-078:** everyday row actions are one click, or one click after selecting rows in the batch bar; at most two or three row icons are visible, the rest in an overflow menu (Carbon data table guidance). Required data still never sits behind an expansion. | GLOBAL |
| D-105 | **One signal per problem:** a problem shows once, on its row, as an icon and a word; other surfaces link to it; rows are not tinted. | GLOBAL |

---

## Docs impact

Pages to re-capture once this ships (check `docs-manual/contracts.json` for published pages): Environmental order entry, Vector order entry, Sampling Sites admin, Custom Data Export (new presets), Sample Type settings (receipt range). The manual entry is authored at Acceptance with the `openelis-user-manual` skill.

---

## Out of Scope

- New upstream field operations data: zero catches, trap failure, set and retrieval times, caught versus submitted, lure and placement, new larval habitat fields, host linkage (C-8). The Vector Field Survey panel, collection context and environmental field measurements that exist today are kept (C-16).
- Deconvolution, species identification and re-pooling (V-03).
- Laboratory method blanks and spikes (bench). Field blanks, duplicates and controls with expected values are entered at intake (EV-D8).
- Bottle kits and pre-registration; recurring monitoring templates; importing collections from field apps or FHIR; the CSV bulk intake (OGC-1138), which must use the same rows.
- Warnings when a compliance standard expects field QC.
- Expanded reporting: submission logs, validation against a regulator's rules, resubmission (queued design).
- Phase 2 optional fields, specified later: custody transfer log, field measurements as results, report-to and invoice-to contacts with turnaround and due date, retention date.

---

## Appendix A: Jira tickets folded in

Proposed handling when the Epic is created. Tickets in flight are never closed.

| Ticket | Status | Handling | FRS |
|---|---|---|---|
| OGC-527 Environmental and Vector Testing Module (Epic) | In Progress | Link as the program Epic | whole FRS |
| OGC-1068 Configuration-driven and per-domain required fields | Backlog | Absorb (section I) and close, with a comment citing C-7 | EV-I |
| OGC-1060 Misleading validation message | Backlog | Absorb and close | EV-I4 |
| OGC-1161 Sampling site empty state; admin page missing from the Admin dashboard (the page exists under Admin > Vector Surveillance Setup) | Backlog | Keep, link as prerequisite | EV-G1, EV-G7 |
| OGC-1182 Seed env and vector dictionaries | Backlog | Keep, link as prerequisite | Dependency 11 |
| OGC-1192 Environmental orders invisible on dashboards | In Progress (Mozzy) | Finish, link | Dashboards |
| OGC-1049 Lifecycle and trap type dropdowns empty | In Progress (Herman) | Finish, link | EV-D6 |
| OGC-1050 `/order/environmental/collect` blank page | In Progress (Herman) | Finish or close with Herman's agreement; the route redirects | Route notes |
| OGC-1051 Unsaved-changes guard fires on an untouched form | In Progress (Herman) | Finish, link | EV-A1 |
| OGC-768 S-03e compliance-driven branch | Backlog | Keep, link | EV-B3 |
| OGC-1065 Deconvolution toast wrong count | Backlog | Keep, link (V-03) | Dependency 13 |
| OGC-1138, OGC-1075 CSV bulk intake | Backlog, Icebox | Keep, link; must use the same rows | Out of scope |
