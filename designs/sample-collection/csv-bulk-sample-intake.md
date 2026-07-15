# CSV Bulk Sample Intake (Environmental & Vector) — FRS

**Anchor:** OGC-1075 (CSV bulk intake) under program epic OGC-527 (Environmental / Vector).
**Related:** Order Entry FRS v3 — Three Domain-Scoped Workflows (OGC-537 / OGC-1069); Sample Acceptance Checklist (OGC-580).
**Status:** DRAFT for review. **Date:** 9 Jul 2026.
**Scope note:** Environmental and Vector only. Clinical is explicitly out of scope — bulk CSV intake does not fit the patient-by-patient clinical workflow (see Order Entry FRS v3 §4.1).

> This FRS defines **what must happen across three releases**: **v1** (MVP — validate, set-in-bulk, and manual column mapping), **v2** (saved import profiles), and **v3** (container storage). v2 and v3 are independent, additive increments that reuse v1 unchanged and may ship in either order (see Appendix A). Each Functional Requirements subsection is tagged with its target release; **Appendix A** lists the complete FR set per release. The developer owns the story-level breakdown within each release — this spec defines the scope of each, not the story slicing.

---

## Lab Context

### Current State

Environmental and Vector labs routinely take in **many pre-collected samples at once**. An environmental team returns from the field with a 10×10 storage box or a 96-well plate of water/soil samples; a vector team returns with trays of mosquito pools from a week of trapping. The sample metadata — where it was collected, when, what to test, trap type, preservation — already exists in a spreadsheet the field team filled in on a laptop or tablet, or in an export from a separate field-data tool.

Today, to get those samples into OpenELIS, a lab technician opens the Add Environmental Order (or Add Vector Order) form and keys them in **one sample at a time**. A box of 100 samples means 100 passes through the same wizard. There is no common spreadsheet layout — every field team's file has different column names, different ways of writing the sample type ("serum", "Serum", "SER"), and dates in whatever format the laptop's locale produced.

### Pain

Hand-keying a full box is slow and error-prone. A technician re-typing 100 rows will transpose a site name, misspell a test, or misread a handwritten sample type — and because sample type and test selection drive everything downstream (which analyzer, which reference range, which report), a single wrong value can route a sample incorrectly or block it at validation, forcing a retest. Data that already exists digitally in the field spreadsheet is being re-typed by hand purely because OpenELIS has no way to ingest the file. On top of that, dates in the field file are often in a different format than OpenELIS expects; a "collection date" of 03/04/2026 silently means March 4 to the field tablet and April 3 to the server, and a known OpenELIS defect rejects the whole save with a cryptic "sampleXML date is not in a valid date format" when the day-of-month is greater than 12.

### What Changes

The receptionist sets the shared details once — the requesting organization, the contact, the sampling site, the compliance standard — then uploads the field spreadsheet of individual samples instead of re-typing it. OpenELIS reads every row, checks each value against what the lab actually has on file — sample types, tests, panels — and shows a preview grid that marks each row **ready** or **needs attention**. Crucially, it does not try to guess what a mistyped or missing value means: the technician knows these samples, so where a value is blank or unrecognized they set the right one, and because a whole batch usually shares a value they can **set it for every row at once** ("all of these are Surface Water, collected on the 6th"). Dates are normalized to the lab's configured format up front, so the day-of-month defect never fires. When every row is ready, one click creates all the orders and samples at once — a box of 100 samples lands in the same state as if each had been entered by hand, ready for Label & Store and QA Review. A morning of typing becomes a five-minute upload-set-and-go.

---

## Navigation & URL

- **Entry point:** a **"Bulk import samples"** action at the **very bottom of the Enter Order page, below the manual Per-Sample Manifest section**, on the existing **Add Environmental Order** and **Add Vector Order** pages — the bulk alternative to entering sample rows by hand in that manifest. The order-level fields (Org, Requestor, Site, Compliance Standard, Program) are the page's existing fields, entered once above; the importer only populates the **samples** on that order. Clicking it **expands the importer inline on the same page** (Carbon inline-expansion pattern, D-005) — below the manifest, above the Save footer — not a modal and not a separate route. It is **not** a separate top-level menu item and does **not** re-create the order form — it is an alternate way to add the samples to the order in progress. (Domain is fixed by which order page launched it; there is no domain picker inside the importer — consistent with the strict CLINICAL/ENVIRONMENTAL/VECTOR enum, no BOTH.)
- **Breadcrumb:** `Home / Orders / Add Environmental Order / Bulk Import` (and the Vector equivalent). Breadcrumb labels carry i18n keys (see Localization).
- **URL route:** reuse the domain's existing order-entry route with a `bulk-import` sub-path (e.g. the Environmental order route + `/bulk-import`, Vector + `/bulk-import`). **Confirm the exact base route against the live app before implementation** (shipped app is the source of truth; the order-entry routes were still settling in FRS v3). Deep-linkable: opening the URL loads the importer for that domain.

---

## Overview

CSV Bulk Sample Intake lets Environmental and Vector labs load many pre-collected samples into OpenELIS from a spreadsheet in one pass, instead of entering them one at a time. The receptionist sets the **order-level** details once in the normal order form (Requesting Organization, Requestor, Sampling Site, Compliance Standard, Program — one value each, applied to all samples), and the CSV carries only the **per-sample manifest**. It has three parts:

1. **A manifest template** the lab can download (CSV and XLSX) covering the per-sample columns (sample type, collection date, conditions, GPS, container, position, client sample ID, tests).
2. **A validating preview** that checks each manifest value against OpenELIS's real reference data and flags anything that won't import, so the operator — who knows these samples — can **set or correct values fast, inline or in bulk** ("set this for all rows"), before committing.
3. **A commit step** that creates the orders and samples in bulk, landing them in exactly the state the manual Enter Order path produces — so every downstream stage (Label & Store, QA Review / Sample Acceptance Checklist) behaves identically.

The design deliberately **does not build a guessing/matching engine**. The operator knows the samples; the system's job is to validate against the registry, flag gaps, and make setting the right value fast (FR-4 through FR-8). "Set it" beats "guess it," and it keeps the build small.

---

## User Stories

1. **As an environmental lab technician,** I want to upload a box of pre-collected water samples from a spreadsheet so that I don't re-type 100 rows by hand.
2. **As a vector lab technician,** I want to load a week of mosquito-pool collections from the field team's export so that trap metadata and collection dates come in exactly as recorded.
3. **As a lab technician,** I want OpenELIS to flag which values won't import and let me fix them inline so that I correct problems in one place instead of hunting through the source file and re-uploading.
4. **As a lab technician,** when a column is blank or wrong for the whole batch (e.g. sample type, collection date), I want to **set the right value once and apply it to all the samples**, because I know what they are — I don't need the system to guess.
5. **As a lab supervisor,** I want bulk-imported samples to land in the same state as hand-entered ones so that Label & Store, storage assignment, and QA Review work with no special-casing.

---

## Functional Requirements

### Template — [v1]

- **FR-1 — Downloadable manifest template.** The importer offers a template download in two formats: **CSV** and **XLSX**. The default template includes **one column for every per-sample field the live manifest keeps for that domain** (per the Data Model manifest tables — Sample Type, Container, GPS Lat/Lng, Location Details, Collected date+time, Lab-performed-sampling, Tests & Panels, Position; plus the proposed Client Sample ID and the Vector organism/pool/trap columns) so the field team has a place for everything the lab records — nothing they capture gets dropped for lack of a column. Order-level fields (Org, Requestor, Site, Compliance Standard, Program) are **not** in the template — they're set once in the order form. Column headers carry a stable machine key plus a human label; a second header row (or XLSX cell comment) gives a one-line instruction and an example value.
- **FR-2 — XLSX with constrained cells.** The XLSX template applies data-validation dropdowns **only to genuinely small controlled lists** (e.g. Compliance Standard, Collection Method) where enumerating every value in an Excel dropdown is practical. It does **not** enumerate large sets — **Sample Type runs to hundreds of values in a real deployment** and must not be forced into an unwieldy Excel dropdown; the same applies to Tests, Panels, Sites, and Organizations. Those are left as free text in the template and resolved in-app via typeahead (FR-6). The dropdown contents for the small lists are generated from the deployment's current reference data at download time. Plain CSV is still accepted on upload (FR-3); the XLSX constraints are a convenience, not a requirement.
- **FR-3 — Upload.** The user uploads a `.csv` or `.xlsx` file. The importer detects the header row, tolerates common encodings (UTF-8, UTF-8-BOM) and delimiters (comma, semicolon), and reports a clear error if the file can't be parsed at all (not a row-level problem — a whole-file problem, e.g. binary file, no header row).

### Validation & fast correction (human-driven) — [v1]

> The person entering the batch **knows these samples**. The importer does not try to guess what an ambiguous value means or run a fuzzy-matching algorithm — a matching engine would be less reliable than the operator and costly to build and tune. Its job is narrower and more useful: **check each value against what OpenELIS holds, flag anything that won't import, and make it fast for the person to set the right value — one cell at a time or in bulk.** "Set it" beats "guess it."

- **FR-4 — Order-level fields are set once, outside the manifest.** **Requesting Organization, Requestor, Sampling Site, Compliance Standard, and Program are order-level**: the receptionist sets each one **once**, in the normal order form, and it applies to every sample in the batch. OpenELIS does not accept multiple values for these on a single order, so they are **not columns in the CSV**. The uploaded file is purely the **per-sample manifest** (Sample Type, collection date/time, conditions/preservation, GPS, container, position, client sample ID, tests/panels — see Data Model). This removes those fields from the per-row correction problem entirely.
- **FR-5 — Three-state validation, resolved by distinct value (no guessing).** On upload, each manifest cell is classified into one of three states, resolving each **distinct value once** per column (not once per cell — a 100-row file with 4 sample types does 4 lookups):
  1. **OK (green):** matches a registry entry, is a validly-formatted value, or is an intentionally-blank *optional* field.
  2. **Required (red):** a **required** field is missing or unmatched. The required per-sample fields are exactly **Sample Type** and **at least one Test/Panel** on the row — nothing else. Red cells **gate commit**.
  3. **Advisory / needs attention (amber):** an *optional* field carries a value that doesn't match a registry entry or won't parse (e.g. an unmatched Container, a malformed GPS or optional date). Amber is a heads-up; it **does not gate commit** — the person can set it or import as-is.

  There is **no "did you mean" state and no confidence score** — a value matches or the person sets it. A blank *optional* field is OK, never flagged. Each row rolls up to the worst of its cells (**Ready / Advisory / Required**); the preview shows the per-row status and marks the cells.
- **FR-6 — Set or correct inline via typeahead.** The person fixes any flagged cell in place, without editing the source file. **Every reference picker is a typeahead Carbon `ComboBox`, never a static `Select`** — **Sample Type included** (assume hundreds of types; it is a large/growing set like Tests, Panels, and Sites — D-007). Cardinality follows the order model: **Sample Type is single-select** (one value per sample); **Tests / Panels is multi-select** (a sample can carry several). **Every selected controlled-vocabulary value renders as a removable chip showing the full name** — a single-select field (Sample Type, Container) shows one chip; a multi-select (Tests/Panels) shows several (e.g. `Total Coliforms (TC)`, `E. coli (ECOLI)`) — never an abbreviation or a count like "3 tests". Each chip has an **× to remove it**: removing a single-select chip clears the cell (re-flagging it red if it was required, e.g. Sample Type); removing one Tests/Panels chip drops just that test, and removing the last one re-flags the row red (≥1 required). Free-text, date, and number cells accept a typed value, re-validated on entry (not chips).
- **FR-7 — Set in bulk (the primary tool).** Because a batch shares most values and the operator knows them, the person sets whole columns at once rather than cell by cell:
  - **Set for all** — pick a value once and apply it to every row, or to just the **blank / needs-attention** rows, in that column. All samples are "Surface Water" but the file left it blank → set it for all in one action. This is how a missing Sample Type, collection date, or preservation method gets filled in seconds.
  - **Replace all occurrences** — when a raw value appears in many rows (e.g. "srm" in 40 rows), setting it to the canonical value once updates all 40. Keyed on (column, original value); the grid shows how many rows it will affect before applying, with an opt-in **scope-down to a single row** for the rare case the same string means different things across rows.

  Same mechanic in both directions — fill the blanks or fix the typos — and it is the concrete answer to "the person knows, let them set it quickly."

  **Set-for-all is invoked from the column header**, in context, not from a separate panel — a "Set all" control on each bulk-eligible column header. Once set, the **current batch value shows as a chip on that header** (removable ×, and the control reads "Change"), so the operator can always see what every sample will get. Fields that are inherently unique per sample (Position, Client Sample ID) have no Set-for-all control. GPS Lat/Lng default to per-sample but **do** offer Set-for-all, since a batch collected at one point can share coordinates.
- **FR-7c — Per-row edits take precedence and are reversible.** A single-cell edit **overrides** the column's Set-for-all value for that row and is **not** overwritten by a later Set-for-all — so an intentional exception survives. Any row carrying a per-row override is marked **"edited"** in its status cell, with a one-click **reset to the batch value** (clears the override, the row falls back to the Set-for-all / file value). This prevents the silent-surprise where a later Set-for-all appears not to apply to a row.
- **FR-8 — Add-new (config-gated).** Where the deployment's Order Entry configuration **allows free-text / new entries** for a reference type, the typeahead picker offers **"+ Add new…"**, which creates the record and persists it for reuse — exactly as the manual Enter Order form does. Where the configuration **restricts** entry, the affordance is **shown disabled with a message that adding new entries is disabled by the administrator** (not silently hidden). The importer reuses the same allow/restrict configuration and the same registries as the manual form; it must not introduce a parallel path.

### Dates, locale, and normalization — [v1]

- **FR-9 — Date normalization.** All date/time columns are interpreted and stored using the deployment's **configured Date locale** (Admin → General Configuration → Site Information), the same rule the manual order form follows. The importer normalizes dates against that locale **at preview time** and shows the normalized value, so the known day-of-month defect (sampleXML emitting MM/DD/YYYY while the app expects DD/MM/YYYY) can never reach the server. Collection **date** and collection **time** are captured; both normalize the same way and are commonly **Set for all** (FR-7), since a batch is often collected in one session. **Collection time missing is advisory (amber), never blocking** — it is valuable because it feeds hold-time / SOP calculations, so a blank time is surfaced so staff can add it. If it is left blank, a **12:00 AM (00:00) placeholder is applied** so the SOP hold-time math can still run, and the sample is marked as time-defaulted so downstream users know the time was assumed, not recorded. Where a raw value is genuinely unparseable, the cell is amber for the person to set.

### Preview, commit, and results — [v1]

- **FR-10 — Validating preview grid.** The preview is a DataTable: one row per sample, a per-row status (**Ready** / **Advisory** / **Required**), cell-level markers colored green/amber/red, and a summary banner ("100 rows: 86 ready, 12 required missing, 2 advisory"). The person can filter to just the rows needing attention, and the bulk **Set for all** actions (FR-7) act on the filtered set. Red and amber cells are both fixable; only red blocks Create.
- **FR-10b — Grid stays readable with the full manifest (~10 columns).** With every manifest column mapped the table is wide, so: (a) the grid scrolls horizontally within its container (the surrounding page does not); (b) a **Compact** toggle hides columns whose value is **identical across every row** — typically the bulk-set columns and the all-blank ones — and summarizes them as **"same for all N samples"** chips above the grid, so the per-row view narrows to just the columns that actually vary (e.g. GPS, client sample ID). Required columns with any red cell are never hidden. This keeps the exception-spotting job manageable no matter how many columns are mapped, and it reinforces the set-in-bulk model: once a column is set for all, it folds out of the row-by-row view.
- **FR-11 — Commit gate (required only).** **Commit is disabled only while any row is Required (red)** — i.e. missing Sample Type or with no Test/Panel. **Advisory (amber) rows do not block commit**; they import as-is (the unmatched optional value is dropped/left blank on that sample, consistent with the manual form leaving optional fields empty). The person may **discard** individual rows from the staging batch before commit (a staged, not-yet-persisted row is transient scratch data — discarding it is not a domain-record deletion). Discarding is the only removal; there is no post-commit bulk delete of created orders (created orders follow the normal order lifecycle).
- **FR-11b — Pre-commit review summary.** Before the person commits, the importer shows a plain-language summary of the batch so they can sanity-check {n} orders in one glance instead of trusting a bare button: the **order-level** values (Org, Site, Compliance Standard — applied to all), the values **shared across every sample** (the Set-for-all chips — e.g. "Sample Type: Surface Water; Tests: Total Coliforms, E. coli"), which columns **vary by sample** (e.g. GPS, Client ID), the client-ID range for reconciliation, storage disposition (loose in v1), and any **defaults being applied** (e.g. collection-time → 12:00 AM placeholder for N rows). This is the reassurance step for a receptionist about to create a hundred records at once.
- **FR-12 — Bulk commit is all-or-nothing, with a submit guard.** On commit, the importer creates one order + sample per row through the **same write path and required-field configuration** as the manual Enter Order workflow, so imported samples are indistinguishable from hand-entered ones downstream. Each sample gets a generated Lab Number. The commit is a **single all-or-nothing transaction**: if any row fails, the whole batch rolls back and nothing is created, so there are no orphaned/half-created orders and no burned Lab Numbers — the person fixes the reported row and re-commits. The **Create** button is **disabled the moment it is clicked** until the server responds, so a double-click cannot create the batch twice. (Cross-batch dedupe — catching a re-upload of the same file — is a v2 concern; the all-or-nothing + submit-guard rules keep v1 safe against the common double-submit case without it.)
- **FR-13 — Import summary + error report.** After commit, the importer shows how many orders/samples were created and their Lab Numbers, and offers a **downloadable report** of any rows that were discarded or failed, with the reason per row, so the user can reconcile against the source file.
- **FR-14 — Empty / large-file states.** An empty file (header only, no rows) shows an empty-state message. A file larger than a configured row ceiling shows a clear message rather than hanging; the ceiling is sized for the real use case (a 96-well plate / 10×10 box → ~100 rows; set the ceiling generously above that).

### Column mapping — [v1]

> The manifest template defines the expected columns, but field files won't always arrive with the exact headers or column order — and there is no common field template today. So v1 accepts **any column layout** via a one-time manual mapping, which keeps it usable on day one. Consistent with the philosophy: **the person maps, the system doesn't guess.** (This is cheap in v1 because the template *is* a built-in mapping — applying a mapping is the same code path either way. Saving a mapping for reuse is v2.)

- **FR-20 — Manual column mapping.** On upload, if the file's headers don't already match the manifest template, the operator is shown a mapping step: each source column on the left, a typeahead picker of OpenELIS manifest fields on the right. Prefill is **deterministic only** — an exact header-name match against the template (the template is the default mapping); no fuzzy or value-sniffing inference. Anything unmatched is left blank for the operator to set; source columns that aren't needed can be explicitly ignored. Validation (FR-5) and set-in-bulk (FR-7) then run on the mapped columns. The file cannot proceed to the preview until every **required** field is mapped. If the headers already match the template, the mapping step is skipped silently.

### Storage layout — save the batch as a box/plate container — [v3]

> A batch of pre-collected samples usually arrives *as a physical container* — a 96-well plate, a 10×10 cryobox. OpenELIS storage already models **boxes as a storage-unit type** with addressable **positions**, so the importer can create that container once and drop every sample into its well, instead of assigning 100 samples to storage one at a time. This reuses the existing storage hierarchy and the shared `LocationPicker`; it introduces no new storage entity and no `Sample.location` field (D-016).

- **FR-15 — Storage layout preset (a choice, not mappable columns).** At import the user picks a **container layout** for the batch: **96-well plate** (8×12), **128-position box**, **10×10 box** (100), or **Loose samples (no container)** (default). The geometry of each layout is fixed and known, so it is a single selection — it does **not** add columns the user must map. Presets are seeded defaults; the set can grow without touching the import flow.
- **FR-16 — Position comes from the layout OR from the CSV.** Each sample's addressable **position** in the container can be set two ways, and the importer supports both:
  1. **From the row/column layout (auto-fill):** the user picks the order the samples were physically loaded with a plain-language control — **"How were the samples loaded?"** — offering **"Left to right, row by row (A1, A2, A3 …)"** (default) and **"Top to bottom, column by column (A1, B1, C1 …)"**. Positions are generated in that order across the chosen geometry. User-facing copy must never say *row-major / column-major* — describe the direction and show the example sequence.
  2. **From a field in the CSV:** if the manifest includes a **Position** column (well/coordinate per sample, e.g. `A1`, `C7`), those values are used directly and take precedence over auto-fill. This covers batches that were loaded out of order or whose positions were recorded in the field file.

  **Position is unique per container — no two samples can occupy the same well.** A duplicate position is an error, and because it's inherently per-sample it is **never a Set-for-all field** (unlike the shared manifest columns). Positions are validated against the chosen geometry: blank (when a position is required), **duplicate**, or out-of-range positions are flagged and the plate-map (FR-19) shows the conflict visually.
- **FR-17 — Save the batch as a container storage unit.** On commit, when a layout is chosen, the importer creates a **new box/plate storage unit** (existing storage-unit type) sized to the layout and assigns each sample to its position within that unit through the **existing storage-assignment path** — not a new field on Sample (D-016). The container gets a name (default derived from site + date, e.g. *"Riverside 2026-03-06"*; editable before commit).
- **FR-18 — Place the container, or leave it unplaced.** The new container may be assigned to a parent storage location (freezer/shelf/rack) via the **existing shared `LocationPicker`** search-and-select, **or left unplaced**. An unplaced container is a valid end state (created, addressable, not yet located) and can be placed later from the normal Storage screens. Skipping placement requires no extra click, matching the manual workflow's rule that storage assignment is optional to advance.
- **FR-18b — Fit with the existing Storage screens.** The box/plate is a **storage unit in the existing hierarchy** (fridge → shelf → box → positions), so it should appear in the normal Storage screens as an **expandable node** — expand the box to see its wells, each holding its sample — like any other unit, with no new storage UI. Placement reuses the **same `LocationPicker`** as the manual Move/Assign flow. *(Verify against the live Storage UI: confirm the storage tree renders a box as expandable-with-wells today. If it does, the plate-map view is effectively available in the Storage screens too; if it only lists sample rows, the plate-map lives inside the importer only. This determines how much of FR-19 is reused vs. importer-specific.)*
- **FR-19 — Plate-map preview.** When a layout is chosen, the preview offers a **plate-map view**: the container grid with each well colored by its row status (valid / needs-review / invalid) and showing the sample at that position, so the user can spot a gap, a doubled well, or a misfilled position before committing. Loose batches keep the flat grid preview (FR-10) only.

### Saved import profiles — [v2]

> v1 already lets the operator map any file (FR-20), but they re-map on every upload. v2 removes that repetition: a mapping can be **saved and reused**, so a team that always exports the same layout maps once. It reuses v1's mapping step, validation, set-in-bulk, and commit path unchanged; it only adds persistence and management.

- **FR-21 — Saved import profiles (the real payoff).** A profile is a saved, named **column-mapping** (source header → OpenELIS manifest field), scoped to a domain. It is deterministic memory of a file layout — **not** value automatching or a guess. It only pre-selects what each column means; validation and set-in-bulk (FR-5–FR-7) run unchanged on top.
  - **Selectable in the import flow.** On the bulk-import screen (inside Add Environmental/Vector Order) the person can pick a saved profile from a **"Use a saved profile"** control, and the importer also **auto-suggests** one when the uploaded file's header signature matches. **The suggestion is never binding** — the resulting mapping is shown on the mapping screen (FR-20) and every column can be overridden before continuing, so a wrong profile can never silently commit.
  - **Fixing or removing a bad profile.** Profiles are **editable, deactivatable records** — never hard-deleted (D-002). If a profile was saved with a wrong mapping, the person either corrects it in the moment (edit the mapping inline and re-save/update the profile) or **deactivates** it from an inline **"Manage saved mappings"** list on the import screen (a deactivated profile stops being auto-suggested and offered). Management is inline on the import screen for the first cut; a dedicated admin page is a later option, not required. *(Open item: confirm whether profiles are deployment-wide or owner-scoped — default deployment-wide, single-tenant.)*
  - **Templates are seeded profiles.** The v1 fixed templates are seeded default profiles — a template is just a pre-saved mapping — so v1 and v2 share one code path rather than being two.
- **FR-22 — Robustness extras (optional within v2).** Encoding/delimiter auto-detection beyond the v1 tolerances; a **dedupe warning** when an incoming row closely matches an already-imported sample (same site + collection date + client sample ID), surfaced as an advisory, never an automatic block. A per-value **alias memory** (remembering that "srm" was set to "Serum" last time) is a *possible* later addition, but it is explicitly **not core** — the operator setting the value is fast enough that learned aliases are a minor convenience, not a requirement.

---

## Data Model & Reuse

Every field maps to an existing OpenELIS entity from the Environmental/Vector order model (Order Entry FRS v3 §4.2–§4.3, §5). No new domain concepts are introduced. Fields divide cleanly into **order-level** (set once in the order form, applied to all samples — not in the CSV) and **sample-level** (the CSV manifest, one row per sample).

### Order-level — set once in the order form, applied to every sample (NOT in the CSV)

| Field | Maps to | Required | Control |
|---|---|---|---|
| Requesting Organization | Organization registry | Required* | typeahead ComboBox |
| Requestor (contact) | Requestor registry | Required* | typeahead ComboBox |
| Sampling Site | Site registry | Required | typeahead ComboBox |
| Compliance Standard (Env) | Compliance standards list | Required (Env) | typeahead ComboBox |
| Program | Program list | Optional | typeahead ComboBox |

These follow the manual Enter Order form exactly (same registries, same search/store, same free-text allow/restrict config). OpenELIS holds one of each per order, so they are never repeated per row.

### Sample-level — the CSV manifest (row = one sample)

**Environmental** — columns mirror the live Enter Order → Per-Sample Manifest table (one row = one physical sample), verified from the shipped page (D-008):

| Column | Maps to | Required | Set/validate as |
|---|---|---|---|
| Sample Type | Sample type dictionary (hundreds) | **Required (red)** | typeahead ComboBox / Set-for-all |
| Tests & Panels (name or code) | Test catalog / panels | **Required — ≥1 (red)** | typeahead ComboBox / Set-for-all |
| Container | Container list | Optional (amber if unmatched) | typeahead ComboBox / Set-for-all |
| GPS Lat | Geolocation | Optional | numeric; usually per-sample but **Set-for-all allowed** (e.g. one site) |
| GPS Lng | Geolocation | Optional | numeric; usually per-sample but **Set-for-all allowed** |
| Location Details | Sample location note | Optional | free text |
| Collection date | Sample collection date | Optional (amber if unparseable) | date (locale-normalized) / Set-for-all |
| Collection time | Sample collection time | Optional — **amber if blank** (SOP hold-time); 12:00 AM placeholder if left empty | time / Set-for-all |
| Lab performed sampling | Boolean flag on sample | Optional | checkbox / Set-for-all |
| Position (in box/plate) — **v3 only** | Storage position (addressable) | Optional; **unique per container** | from layout fill-order or a CSV column; never Set-for-all |
| Client / external sample ID *(proposed — confirm)* | Sample external reference *(confirm field)* | Optional | free text; carried for reconciliation |

> **Reconciled to the live page.** These columns match the shipped manifest table (Sample Type, Container, GPS Lat/Lng, Location Details, Collected, Tests & Panels, Lab-performed-sampling). Two deltas to confirm before build: (a) **Client sample ID** is *not* a column on the live page today — it's proposed here for reconciliation and must be confirmed against the Sample external-reference field or declared a dependency; (b) collection **method / temperature / weather / preservation / SOP holding time** are **not** per-row on the live manifest — they live in the order-header collection defaults (the blurred region), so they are order-level unless the manifest is later extended. Do not add them as manifest columns without confirming.

**Vector** — same order-level fields; manifest columns:

| Column | Maps to | Required | Set/validate as |
|---|---|---|---|
| Client / external sample ID | Sample external reference *(confirm field)* | Optional | free text; carried for reconciliation |
| Trap type / Trap ID | Trap collection metadata | per config | typeahead / free text / Set-for-all |
| Collection date | Sample collection date | per config | date (locale-normalized) / Set-for-all |
| Collection time | Sample collection time | per config | time / Set-for-all |
| Genus / species (if known) | Organism fields | Optional | typeahead ComboBox |
| Pool size / count | Pool fields | Optional | numeric |
| Tests / Panels (name or code) | Test catalog / panels | **Required — ≥1 (red)** | typeahead ComboBox / Set-for-all |
| Position (in box/plate) — **v3 only** | Storage position (addressable) | Optional; **unique per container** | from layout fill-order or a CSV column; never Set-for-all |

> **Only two per-sample fields gate commit:** **Sample Type** and **at least one Test/Panel** (red). Every other manifest field is optional — a blank optional field is fine, and an unmatched optional value is **advisory (amber)** that imports as-is without blocking. This matches the manual form, which lets optional fields stay empty.

\* Requester model per FRS v3 §5: at least one of Requesting Organization / Requestor is required; both are captured. The required set is **read from the deployment's Order Entry / Patient Entry configuration** via the same API as the manual form — the importer must not hardcode its own required set.

> **Client sample ID (confirm field):** a batch of pre-collected samples nearly always carries the field team's own identifier, and the lab needs it to reconcile OpenELIS Lab Numbers back to the source spreadsheet after import. Confirm the existing Sample external/client reference field to bind it to; if none exists, declare it as a named data dependency rather than inventing a field.

> **Vector note:** bulk intake creates the order/sample (and pool) rows only. Species identification and pool **deconvolution** (`LABNO.X-Y` aliquot numbering) remain downstream at Results › Vector Identification and are out of scope. Whether a pool is one manifest row or several samples needs confirming against the vector pool model before build (a pool may not be a clean one-row-one-sample). Vector pools arriving via FHIR (Fast Healthcare Interoperability Resources) referral are a separate intake path, not this importer.

> **Vector pools and the container concept (design harmony, future extension).** At **intake**, a vector pool is one sample occupying one well, so it flows through v3's box/plate container exactly like an environmental sample — a box of pooled tubes places into a storage location the same way. The concept extends naturally **one level down**: after deconvolution, a pool becomes a parent with child aliquots (`LABNO.X-Y`) that themselves need storage positions — the same container → positions → location model applied to a pool's aliquots. That aliquot-level storage is a **future extension**, not v3 scope; it is noted here so the container model is designed consistently and the later work slots in without rework.

---

## Access & Roles

- The importer is available to **any user who can create Environmental / Vector orders** through the manual Enter Order path — i.e. it lives entirely inside the existing order-entry capability for those domains. No new role or permission key is introduced.
- Visibility follows the same domain/unit scoping as the parent workflow: a user sees the Environmental importer only if they can enter Environmental orders, the Vector importer only if they can enter Vector orders; admins see both.
- A user without order-entry access for a domain does not see that domain's order workflow at all, and therefore does not see its "Bulk import samples" action.

---

## Localization

All visible strings use `t(key, fallback)` under the `order.bulkImport.*` namespace (kept distinct from analyzer-import keys).

| Key | Fallback |
|---|---|
| `order.bulkImport.title` | Bulk Import Samples |
| `order.bulkImport.breadcrumb` | Bulk Import |
| `order.bulkImport.template.downloadCsv` | Download CSV template |
| `order.bulkImport.template.downloadXlsx` | Download Excel template |
| `order.bulkImport.upload.dropzone` | Drag a file here or browse (.csv, .xlsx) |
| `order.bulkImport.upload.parseError` | This file could not be read. Check that it has a header row and is a CSV or Excel file. |
| `order.bulkImport.status.ready` | Ready |
| `order.bulkImport.status.required` | Required |
| `order.bulkImport.status.advisory` | Advisory |
| `order.bulkImport.summary` | {total} rows: {ready} ready, {required} required missing, {advisory} advisory |
| `order.bulkImport.required.hint` | Sample Type and at least one Test/Panel are required; other fields are optional. |
| `order.bulkImport.cell.pick` | Set a value |
| `order.bulkImport.cell.addNew` | + Add new… |
| `order.bulkImport.cell.addNewDisabled` | Adding new entries is disabled by the administrator |
| `order.bulkImport.action.setForAll` | Set for all rows |
| `order.bulkImport.action.setForBlank` | Set for all blank rows |
| `order.bulkImport.action.replaceAll` | Replace every "{value}" in this column |
| `order.bulkImport.cell.appliesToRows` | Applies to {n} rows |
| `order.bulkImport.cell.thisRowOnly` | Apply to this row only |
| `order.bulkImport.action.discardRow` | Discard row |
| `order.bulkImport.action.commit` | Create {ready} orders |
| `order.bulkImport.commit.gateBlocked` | Set the required Sample Type and at least one Test/Panel on every red row before creating orders |
| `order.bulkImport.result.created` | Created {n} orders |
| `order.bulkImport.result.downloadReport` | Download error report |
| `order.bulkImport.empty` | The file has no data rows. |
| `order.bulkImport.tooLarge` | This file has more rows than the importer accepts in one batch ({max}). Split it and upload again. |
| `order.bulkImport.storage.layout` | Storage layout |
| `order.bulkImport.storage.layout.loose` | Loose samples (no container) |
| `order.bulkImport.storage.layout.plate96` | 96-well plate |
| `order.bulkImport.storage.layout.box100` | 10×10 box |
| `order.bulkImport.storage.fillOrder` | How were the samples loaded? |
| `order.bulkImport.storage.fillOrder.rows` | Left to right, row by row (A1, A2, A3 …) |
| `order.bulkImport.storage.fillOrder.cols` | Top to bottom, column by column (A1, B1, C1 …) |
| `order.bulkImport.storage.containerName` | Container name |
| `order.bulkImport.storage.place` | Place this container in a storage location |
| `order.bulkImport.storage.leaveUnplaced` | Create the container without placing it |
| `order.bulkImport.storage.plateMap` | Plate map |
| `order.bulkImport.mapping.title` *(v2)* | Map your columns |
| `order.bulkImport.mapping.saveProfile` *(v2)* | Save this mapping as a profile |
| `order.bulkImport.mapping.useProfile` *(v2)* | Use a saved profile |

---

## Dependencies

- **Order Entry FRS v3 write path (OGC-537 / OGC-1069)** — the importer commits through the same order/sample creation path and the same **Order Entry / Patient Entry configuration** (required-field set, free-text allow/restrict) as the manual Enter Order form. It must reuse, not re-implement, this path. *(Coordination dependency — HIGH.)*
- **Existing registries / reference data** — Site registry, Sample Type dictionary, Test catalog + Panels, Compliance Standards, Requesting Organization + Requestor registries, Program list. All exist today; the resolver reads them. No new data model.
- **Storage hierarchy + shared `LocationPicker` (storage-location-repolish; OGC-657)** — the storage-layout feature (FR-15–FR-19) creates a box/plate **storage unit** (existing storage-unit type) with addressable **positions**, assigns samples via the existing storage-assignment path, and places the container using the shared `LocationPicker` search-and-select. Reuse the shared component; do **not** fork a bulk-only picker, and do **not** introduce `Sample.location` (D-016). Coordinate with the storage-location-repolish effort and the OGC-657 shared-modal lift. *(Confirm programmatic creation of a box/plate unit with a generated position grid against the storage module.)*
- **Lab-unit → domain assignment (Test Catalog work)** — drives which domain importer a user sees, same dependency as the parent order-entry visibility. Not blocking for the importer mechanics.
- **Configured Date locale (Site Information)** — FR-9 reuses it; already present.
- **Out of scope / separate paths:** Vector pool deconvolution and species ID (Results › Vector Identification); FHIR-referral pool intake; Clinical bulk import.

**New capability to build (declare, don't assume):** a **validation-and-set service** — check each distinct manifest value against a registry (exact match, OK / needs-attention), plus the set-for-all / replace-all bulk operations. This is deliberately *not* a fuzzy-matching engine; it's registry lookups (which the manual typeahead already does) plus batch-apply logic over the staged rows. Building it against the existing registry search endpoints is the core v1 lift; confirm those endpoints return what the lookups need.

---

## Appendix A — Functional requirements by release

This is the authoritative scope of each release. The developer owns the story-level breakdown within each release; this defines **what** each release must do, not how it is sliced. Both releases cover **Environmental and Vector**.

The releases below are ordered but not tightly coupled: **v1** is the MVP; **v2** and **v3** are each an independent, additive increment that reuses v1 unchanged. v2 and v3 do **not** depend on each other and may ship in either order — they are numbered only to signal that v3 carries an unverified dependency and is therefore the riskier of the two to sequence first.

### v1 — MVP (FR-1 – FR-14, FR-20): template + manual mapping + validate + set-in-bulk + commit

A genuinely usable importer, and deliberately small — no matching engine to build or tune. Targeted to be buildable in about a week with Claude Code.

- **FR-1, FR-2, FR-3** — Downloadable CSV + XLSX **manifest** template (per-sample columns only; order-level fields set in the order form) and upload. XLSX constrains only genuinely small lists (not Sample Type).
- **FR-4** — Order-level fields (Org, Requestor, Site, Compliance Standard, Program) set once in the form, applied to all — not in the CSV.
- **FR-20 — Manual column mapping.** Accept **any column layout**: exact-header matches to the template auto-fill (the template is the default mapping); the operator maps anything else themselves. No saved profiles yet — mapping is per-upload. Deterministic only; no guessing.
- **FR-5 – FR-8** — **Two-state validation** (OK / needs attention) against the registry, resolved by distinct value; **inline typeahead** set/correct (Sample Type included); **set-in-bulk** — Set-for-all and Replace-all-occurrences (the primary tool); config-gated add-new. No fuzzy matching, no confidence scores, no "did you mean."
- **FR-9** — Date-locale normalization at preview time.
- **FR-10 – FR-14** — Preview grid (Ready / Needs attention), commit gate, **all-or-nothing commit through the shared order write path with a submit guard**, import summary + downloadable error report, empty/large-file states.

**Storage in v1 is loose-only, by design.** Samples import with the existing simple/optional storage-location assignment; a batch may be located sample-by-sample or left unplaced. This is a deliberate cut: v1 fully solves the **data-entry** pain but only partially the **storage** pain for a batch that arrived as a plate/box — the container convenience is v3. "Unplaced" is a valid end state, so this de-risks the MVP without blocking it. Expect labs to ask for container handling soon after.

**Explicitly not in v1:** saved/reusable mapping profiles, cross-batch dedupe, box/plate container creation, any value-guessing/fuzzy matching. (Per-upload manual mapping *is* in v1; only its *persistence* is deferred.)

*(If the one-week target gets tight, FR-20 manual mapping is the first thing to defer — v1 still works if files arrive in the template layout. It's folded into v1 because no common field template exists today, so tolerating any layout is worth ~a day.)*

### v2 — Saved import profiles (FR-21 – FR-22)

Removes the re-map-every-time cost by letting a mapping be **saved and reused**. **Independent of v3; lower risk (no unverified dependencies), so the natural next step after v1.**

Saved import profiles (the real payoff; v1 templates are seeded default profiles — one code path, not two), auto-suggested by header signature and always overridable, edit/deactivate management (No-Hard-Delete), plus optional robustness extras (encoding/delimiter auto-detect, advisory dedupe; per-value alias memory explicitly non-core). Reuses v1's mapping step, validation, set-in-bulk, and commit path unchanged — it only adds profile persistence and management.

### v3 — Container storage (FR-15 – FR-19): save the batch as a box/plate

Serves the physical-container scenario that motivates the feature: create the plate/box once and drop every sample into its well. **Independent of v2**, but carries a verification gate — confirm the storage module can create a box/plate storage unit with a programmatically generated position grid before committing to this increment.

Layout presets (96-well / 128 / 10×10 / loose) as a single import-time choice with fixed geometry (no extra columns to map), positions auto-generated by fill order with an optional Position-column override, save the batch as a box/plate **storage unit**, assign each sample to its position via the existing storage-assignment path (no `Sample.location`), place the container via the shared `LocationPicker` or leave it unplaced, and a plate-map preview colored by row status. Touches only the storage step at commit plus one preview view; reuses the storage hierarchy and shared picker rather than building new storage UI.

**Why the increments stay contained:** the resolver, registry lookups, preview grid, commit path, and error reporting are all built in v1 and reused unchanged. v2 and v3 are each an additive layer, not a re-architecture. Building v1 *without* the resolver (strict reject-and-re-upload) was considered and rejected: it would push correction back into the user's spreadsheet, generate support load, and still require the resolver for the later increments — a false economy given no common field template exists today.

---

## Appendix B — Crosscheck summary

**Verdict:** ⚠ Proceed with coordination — the one thing that matters is reusing the Order Entry FRS v3 write path and required-field configuration rather than building a parallel order-creation path.

- **Contradictions (vs decision-log):** none. Domain is fixed per-importer (no BOTH — D-004 ✓); staging-row discard is pre-commit transient scratch, not a domain-record delete (D-002 ✓); **every controlled-vocab/reference picker is typeahead ComboBox — Sample Type included, assuming hundreds of types (D-007 ✓)**; all columns map to real entities (D-009 ✓); no site/tenant selector (D-001 ✓); storage uses the existing hierarchy + shared LocationPicker, no `Sample.location` (D-016 ✓).
- **Overlaps:** Order Entry FRS v3 (shared write path + required-field config + requester search/store) — HIGH, coordinate. Storage-location-repolish + OGC-657 (shared `LocationPicker`) — reuse the shared control for FR-18 placement. Sample Type dictionary, test/panel catalog, site/org registries, storage hierarchy — reuse, render identically.
- **Dependencies:** upstream = order write path + registries + date-locale + storage hierarchy/positions + shared LocationPicker (all exist); the **resolver service is new** and must be declared and built once as shared. Downstream = Label & Store, Sample Acceptance Checklist (OGC-580) must treat imported orders identically to manual ones.
- **Build-once nudges:** the resolver/normalizer (shared with analyzer value-mapping and manual typeahead intent); the `order.bulkImport.*` i18n namespace (keep clear of analyzer-import keys); v2 "import profile" vocabulary (align with, don't collide with, analyzer profiles).
