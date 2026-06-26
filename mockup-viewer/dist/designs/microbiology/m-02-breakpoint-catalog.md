# M-02 Breakpoint Catalog — Functional Requirements Specification

**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Admin → Breakpoint Catalog
**Phase:** 1A
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

> This FRS is self-contained. The AMR design-review edits — the Active/Loaded/Archived legibility banner + snapshot rule, the effective-date explanation, CSV row-level import errors, and the note that BreakpointLookup precedence is shown to users in M-05 — are written **inline** in the relevant sections below; there is no separate edits doc or addendum.

This spec covers the versioned reference catalog of breakpoint tables — CLSI M100 (annually updated) and EUCAST clinical breakpoints (versioned). The catalog drives AST interpretation (MIC or zone → S/I/R) in M-05 and is version-aware: AST Runs snapshot the breakpoint version at result time so subsequent publisher updates don't retroactively change historical interpretations.

---

## 1. Lab Context

**Current State.** A small lab interprets AST by hand against whatever printed CLSI or EUCAST table is current on the bench, then transcribes S/I/R onto the report. When the publisher issues a new annual table, the old printout is replaced and prior results are simply remembered as "interpreted under the old rules."

**Pain.** There is no record of *which* breakpoint version a historical result was read against, so a result re-opened a year later can't be defended. Loading a new CLSI edition mid-year is risky because it silently changes how today's and yesterday's runs interpret. And the per-run choice — "interpret this against CLSI or EUCAST, this version or that" — lives only in the tech's head.

**What Changes.** The catalog holds every loaded standard version side by side, each labelled **Active / Loaded / Archived**, with a banner and tooltips that explain what each status means and that **historical runs keep their standard version forever**. Activation takes an **effective date** so a switchover is deliberate and dated. Breakpoint-standard selection stays **flexible per AST run** (default to the active standard, but any loaded standard/version may be picked and is then snapshotted onto the run); the catalog's job is to manage which standards are loaded and which is active.

---

## 2. Overview

### 2.1 Purpose

Hold the lab's set of breakpoint reference standards. Multiple versions of each standard coexist (CLSI 2024, CLSI 2025, EUCAST v14.0, EUCAST v14.1) so the lab can transition between versions on its own schedule. The `BreakpointLookupService` (called by M-05) takes (organism, antibiotic, method, breakpoint_standard_id) and returns S/I/R thresholds.

**Breakpoint-standard selection is flexible per AST run.** Each AST Run picks the standard it interprets against: it **defaults to the active standard** for the relevant publisher, but the tech may select **any loaded standard or version**. Whatever is chosen is **snapshotted** onto the run (`breakpoint_standard_id` + `breakpoint_version`) and never changes afterward. The catalog manages *which standards are loaded and which is active*; the run records *which was used*.

### 2.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| Breakpoint Standards list | `/admin/microbiology/breakpoint-catalog` | Admin → Breakpoint Catalog |
| Standard detail / breakpoint table view | `/admin/microbiology/breakpoint-catalog/:standardId` | (drilldown from list) |
| Add / Edit Breakpoint Standard | (modal) | — |
| Import breakpoints (from CSV or Hub) | (modal) | — |

### 2.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Full CRUD; activate / deactivate versions; import |
| Microbiology Supervisor | View; cannot modify breakpoints |
| System Administrator | All actions |

### 2.4 Integration

- **M-01 Reference Data** — breakpoints FK to `organism_master` (or `organism_group` for group-level breakpoints) and `antibiotic_master`.
- **M-05 AST Entry & Interpretation** — calls `BreakpointLookupService(organism_id, antibiotic_id, method, breakpoint_standard_id)`. Returns S, I, R thresholds. **M-05 surfaces which precedence level matched** (organism-specific / group / none) so the tech can trust the interpretation — see §6.2.
- **M-04 Case Workbench** — AST Run header records `breakpoint_standard_id` + `breakpoint_version` at setup time. Snapshots survive subsequent catalog changes.
- **M-09 WHONET Export** — writes `breakpoint_standard` value (e.g., `CLSI_M100_2024`) into each exported AST result column.
- **Catalog Subscription & Metadata Sync** (existing) — automated import of new breakpoint-standard versions (FHIR PlanDefinition) from a central catalog; lands them `Loaded`, activated here. *(M-10's bespoke hub retired.)*

---

## 3. Versioning model

This is the heart of M-02. Two principles:

### 3.1 Reference standards are versioned

A `breakpoint_standard` row represents one **version** of one publisher's standard. Examples:

- `CLSI M100 2024` (publisher: CLSI, version: M100, year: 2024)
- `CLSI M100 2025` (publisher: CLSI, version: M100, year: 2025)
- `EUCAST v14.0` (publisher: EUCAST, version: 14.0, year: 2024)
- `EUCAST v14.1` (publisher: EUCAST, version: 14.1, year: 2024)

Each standard owns many `breakpoint` rows. The breakpoints **only apply within that version of that standard**. The same (organism, antibiotic) pair may have different thresholds in CLSI 2024 vs. CLSI 2025; both rows coexist in the catalog.

### 3.2 Results snapshot the version at write time

Per crosswalk Q4 Rule 1:

> When AST is interpreted, the AST Run row records `breakpoint_standard_id` and `breakpoint_version`. The interpretation is computed against that version. **Future updates to the standard do not retroactively change historical AST interpretations.**

So:

- A Case finalized on 2024-12-15 with `breakpoint_standard_id = CLSI_M100_2024` has its AST Results interpreted against CLSI 2024 forever, even after the lab transitions to CLSI 2025.
- The lab can read the historical Case and see the original interpretation that the clinician acted on.
- WHONET exports of that AST Run show `breakpoint_standard = CLSI_M100_2024` so the receiving aggregator knows which standard was applied.

This **snapshot rule** is surfaced to the user, not just enforced in the data model — see the legibility banner and tooltips in §3.6.

### 3.3 The lab's "active" standard

For each publisher (CLSI, EUCAST, other), the lab has zero or one **active** standard at a time. The active standard is the one M-05's `BreakpointLookupService` defaults to for new AST Runs. The lab can have CLSI 2024 active for one period and switch to CLSI 2025 active at a controlled point.

Switching the active standard is a deliberate admin action:

- A lab manager opens M-02, selects the new standard version.
- The system prompts: "Set [CLSI M100 2025] as the active CLSI standard for new AST Runs starting [date]?"
- Lab manager confirms with effective date.
- A `breakpoint_standard_activation_event` row is written (audit).
- The new standard becomes the default for AST setups dated on or after the effective date.

The lab can run a validation period where both standards are loaded but only one is active — useful for side-by-side runs against both before flipping over.

### 3.4 Multiple publishers in parallel

Most labs use one publisher's breakpoints (CLSI in the US, EUCAST in Europe and most WHO-supported settings). Some labs deliberately use both — e.g., a country where the national reference lab follows EUCAST but a national-tier hospital follows CLSI for chemistry parity.

M-02 supports having **both an active CLSI standard and an active EUCAST standard** simultaneously. The AST Setup modal in M-04 lets the tech pick which standard to interpret against per AST Run (per the flexible-per-run rule, §2.1). Default is per the active-standard-for-this-publisher logic.

### 3.5 WHO TB critical concentrations (publisher: WHO_TB)

For *Mycobacterium tuberculosis* complex drug-susceptibility testing (DST), interpretation does **not** use an MIC/zone S-I-R clinical breakpoint. Instead WHO defines, per drug × DST method, a single **critical concentration (CC)** — the lowest drug concentration that inhibits growth of wild-type (susceptible) strains. A TB isolate that grows at the critical concentration is **Resistant**; one that does not is **Susceptible**. There is no "Intermediate" category. WHO additionally publishes **clinical breakpoints (CB)** for some drugs at higher concentrations, but the Phase-1A/1B catalog models the **critical concentration → R/S** rule that drives phenotypic TB DST.

WHO critical concentrations are added to the catalog as a **third breakpoint-standard publisher alongside CLSI and EUCAST**, versioned the same way (per the WHO technical-report guidance year — e.g., `WHO TB 2021`, `WHO TB 2023`). They participate in the identical **Active / Loaded / Archived** status model, the **effective-date** activation workflow, and the **per-run snapshot** rule already described above: a TB AST Run records `breakpoint_standard_id` + `breakpoint_version` at setup and keeps that WHO version forever, even after the lab loads a newer WHO TB guidance.

Critical concentrations are **method-specific** — the same drug has different CCs by DST method. The catalog therefore carries a CC row per **drug × method**, where method is one of:

- **MGIT** (automated liquid culture, e.g., BACTEC MGIT 960)
- **LJ** (Löwenstein-Jensen solid medium, proportion method)
- **AGAR_PROPORTION** (7H10 / 7H11 agar proportion method)

```
WHO TB 2023  (publisher: WHO_TB)
┌────────────────────────┬─────────────┬─────────────────┬─────────────────────┐
│ Organism / Group       │ Drug        │ Method          │ Critical Conc. (R if ≥)│
├────────────────────────┼─────────────┼─────────────────┼─────────────────────┤
│ M. tuberculosis complex│ Rifampicin  │ MGIT            │ 0.5 µg/mL           │
│ M. tuberculosis complex│ Rifampicin  │ LJ              │ 40 µg/mL            │
│ M. tuberculosis complex│ Isoniazid   │ MGIT            │ 0.1 µg/mL           │
│ M. tuberculosis complex│ Levofloxacin│ MGIT            │ 1.0 µg/mL           │
│ M. tuberculosis complex│ Bedaquiline │ MGIT            │ 1.0 µg/mL           │
└────────────────────────┴─────────────┴─────────────────┴─────────────────────┘
```

**Critical concentration is not a molecular result.** Phenotypic DST against a critical concentration is what this section covers. Molecular resistance detection — **GeneXpert MTB/RIF** (rpoB → rifampicin resistance) and **line probe assays (LPA)** for isoniazid/rifampicin/fluoroquinolone/aminoglycoside resistance — is reported as a **genotypic resistance flag on the isolate**, captured in M-14 (Mycobacteriology/TB), **not** through `BreakpointLookupService`. There is no concentration to look up for a molecular call; the result is the assay's R/S/indeterminate verdict per locus.

**Data-model note.** WHO TB CC rows reuse the existing `breakpoint` table with two adjustments captured in §6: `publisher = WHO_TB` on the standard, and the breakpoint row stores a single `critical_concentration` value with `interpretation_model = CRITICAL_CONCENTRATION` (R if measured concentration ≥ CC, else S) rather than the S/I/R triad. The `method` enum gains the TB DST methods (`MGIT`, `LJ`, `AGAR_PROPORTION`). The Active/Loaded/Archived + snapshot machinery is unchanged.

### 3.6 Status legibility — Active / Loaded / Archived (review edit H3)

Because the three statuses carry real workflow consequences, the catalog makes them legible rather than leaving them as bare badges:

- A **persistent banner** at the top of the list (§4) explains, in one line each:
  - **Active** — the lab's current default for new AST Runs against this publisher. New runs interpret against this unless the tech picks another loaded version.
  - **Loaded** — present and selectable per run, but not the publisher's default. Use it for a validation period or a deliberate per-run choice.
  - **Archived** — kept for the record only; **cannot** be chosen for new runs. Still referenced by historical runs that were set up against it.
- Each status badge in the list and detail view carries a **tooltip** with the same definition.
- The banner also states the **snapshot rule** plainly: *"Historical AST Runs keep the standard version they were set up against — forever. Activating a new version never changes past results."*
- On **activation**, the modal (§8) explains the **effective date**: *"New AST Runs created on or after this date default to the new version. Runs before it, and runs already set up, are unaffected."*

---

## 4. List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Breakpoint Catalog                                                   │
│                                                                              │
│ Breakpoint Standards                          [Import]  [+ Add New Version]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⓘ  Active = default for new runs · Loaded = selectable, not default ·        │
│    Archived = historical only.  Historical runs keep their version forever.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search...]   Publisher: [All ▼]   Status: [All ▼]                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Name              │ Publisher │ Version │ Year │ # Breakpoints │ Active │ ⋮ │
├───────────────────┼───────────┼─────────┼──────┼───────────────┼────────┼───┤
│ CLSI M100 2024    │ CLSI      │ M100    │ 2024 │ 1,247         │ Active │ ⋮ │
│ CLSI M100 2025    │ CLSI      │ M100    │ 2025 │ 1,289         │ Loaded │ ⋮ │
│ EUCAST v14.0      │ EUCAST    │ 14.0    │ 2024 │ 832           │ Active │ ⋮ │
│ EUCAST v14.1      │ EUCAST    │ 14.1    │ 2024 │ 835           │ Loaded │ ⋮ │
│ EUCAST v13.1      │ EUCAST    │ 13.1    │ 2023 │ 819           │ Archived│ ⋮│
└───────────────────┴───────────┴─────────┴──────┴───────────────┴────────┴───┘
```

The **status banner (ⓘ)** above the table is the review-edit-H3 legibility affordance; each status badge in the table also carries a tooltip with the same definition.

Status values:

- **Active** — this is the default for new AST Runs against this publisher.
- **Loaded** — present in catalog, available for per-run selection, but not the publisher's default.
- **Archived** — preserved for historical reference; cannot be selected for new AST Runs (only referenced by old ones).

Row actions (overflow menu):

- View Breakpoints (drilldown)
- Set as Active (only if status is Loaded)
- Archive (only if not currently active; warns about historical Case references)
- Export to CSV
- Compare with [other version] (Phase 1B feature; placeholder in 1A)

**Empty state.** Fresh deployment before any standard is seeded: "No breakpoint standards loaded. **Import** a CLSI or EUCAST table (CSV) to begin, or wait for the Phase-1B Hub import."

---

## 5. Breakpoint Standard detail view

Clicking a row from §4 drills into the standard's detail page.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Breakpoint Catalog / CLSI M100 2024                                  │
│                                                                              │
│ CLSI M100 2024                                                  [Active ⓘ]   │
│ Publisher: CLSI · Year: 2024 · 1,247 breakpoints · Effective 2024-01-15     │
│ [Set as Active] [Archive] [Export CSV] [Import Update]                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search by organism or antibiotic...]                                        │
│ Organism: [All ▼]   Antibiotic class: [All ▼]   Method: [All ▼]              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Organism / Group       │ Antibiotic     │ Method │ Spec.  │ S      │ I     │ R     │
├────────────────────────┼────────────────┼────────┼────────┼────────┼───────┼───────┤
│ Enterobacterales       │ Ampicillin     │ MIC    │ —      │ ≤ 8    │ 16    │ ≥ 32  │
│ Enterobacterales       │ Ampicillin     │ Disk   │ —      │ ≥ 17   │ 14-16 │ ≤ 13  │
│ Escherichia coli       │ Ceftriaxone    │ MIC    │ Urine  │ ≤ 2    │ 4     │ ≥ 8   │
│ Escherichia coli       │ Ceftriaxone    │ MIC    │ Other  │ ≤ 1    │ 2     │ ≥ 4   │
│ Staphylococcus aureus  │ Oxacillin      │ MIC    │ —      │ ≤ 2    │ —     │ ≥ 4   │
│ Pseudomonas aeruginosa │ Meropenem      │ MIC    │ —      │ ≤ 2    │ 4     │ ≥ 8   │
└────────────────────────┴────────────────┴────────┴────────┴────────┴───────┴───────┘
  Showing 1-50 of 1,247   [< 1 2 3 ... 25 >]
```

The status badge in the header carries the same Active/Loaded/Archived tooltip as the list; the **effective date** is shown alongside the publisher/year line.

**Carbon components:** `DataTable` with TableToolbar (search + filters), `Pagination`. Edit / Add / Delete actions on rows for individual breakpoint adjustments.

**Filters:**

- Organism (ComboBox referencing Organism Master + Organism Groups)
- Antibiotic class (Dropdown)
- Method (DISK_DIFFUSION / MIC)

Most labs **don't edit individual breakpoints**. The CLSI / EUCAST tables come as imports; modifying them locally is reserved for the very rare lab-specific customization. The list is mostly read-only browsing.

---

## 6. Breakpoint data model

```
breakpoint_standard
├── standard_id (UUID PK)
├── name (text, e.g., "CLSI M100 2024")
├── publisher (enum: CLSI, EUCAST, WHO_TB, OTHER)
├── version_label (text, e.g., "M100" or "v14.0")
├── version_year (int, e.g., 2024)
├── effective_from (date, nullable — when this standard became active in the field)
├── effective_to (date, nullable — when superseded)
├── is_active_for_publisher (bool — at most one true per publisher)
├── activation_effective_date (date — when this lab set it as active)
├── activated_by_user_id (FK, nullable)
├── activated_at (timestamp, nullable)
├── archived (bool, default false)
├── seeded (bool, default false — true if from Hub)
├── notes (text)
└── audit columns

breakpoint
├── breakpoint_id (UUID PK)
├── standard_id (FK to breakpoint_standard)
├── organism_id (FK to organism_master, nullable — null if group-level)
├── organism_group_id (FK to organism_group, nullable — null if organism-specific)
├── antibiotic_id (FK to antibiotic_master — for TB, the anti-TB drug)
├── method (enum: DISK_DIFFUSION, MIC, ETEST, MGIT, LJ, AGAR_PROPORTION — last three TB DST)
├── specimen_type_filter (FK to sample type, nullable — e.g., urine-specific breakpoint)
├── interpretation_model (enum: SIR, CRITICAL_CONCENTRATION — default SIR; CRITICAL_CONCENTRATION for WHO_TB)
├── susceptible_threshold (numeric, nullable — null for CRITICAL_CONCENTRATION rows)
├── intermediate_threshold (numeric, nullable — for S/R-only entries; null for TB CC)
├── resistant_threshold (numeric, nullable — null for CRITICAL_CONCENTRATION rows)
├── critical_concentration (numeric, nullable — set only for CRITICAL_CONCENTRATION rows; R if tested conc. ≥ this)
├── threshold_comparator (enum: LE, GE — "S ≤ value" vs "S ≥ value" — disk diffusion is GE for S, MIC is LE for S)
├── units (text, e.g., "ug/mL" or "mm")
├── notes (text, nullable — e.g., "for uncomplicated UTIs only")
├── seeded (bool, default false)
├── locally_customized (bool, default false — flagged if lab edited the imported value)
└── audit columns

breakpoint_standard_activation_event (audit)
├── event_id (PK)
├── standard_id (FK)
├── action (enum: ACTIVATED, DEACTIVATED, ARCHIVED)
├── effective_date (date)
├── user_id, timestamp
├── notes
```

Constraints:

- Exactly one of `organism_id` or `organism_group_id` is non-null per breakpoint row.
- For one `(standard_id, organism_id OR organism_group_id, antibiotic_id, method, specimen_type_filter)` tuple there is exactly one `breakpoint` row.
- At most one `breakpoint_standard` row per `publisher` has `is_active_for_publisher = true`.

---

## 7. BreakpointLookupService

The service called by M-05 (and any future module that needs to interpret AST values).

### 7.1 Signature

```
BreakpointLookupService.lookup(
   organism_id: UUID,
   antibiotic_id: UUID,
   method: MIC | DISK_DIFFUSION | ETEST,
   breakpoint_standard_id: UUID,
   specimen_type_id: UUID  (optional, used for specimen-specific breakpoints like urine-CRO)
) → {
   susceptible_threshold: numeric,
   intermediate_threshold: numeric | null,
   resistant_threshold: numeric,
   threshold_comparator: LE | GE,
   units: text,
   notes: text | null,
   matched_by: ORGANISM | GROUP | NONE
}
```

### 7.2 Lookup precedence

The service walks through possible matches in this order:

1. **Specimen-specific organism-specific breakpoint** — most specific. Example: `Escherichia coli` × `Ceftriaxone` × `MIC` × specimen filter `urine` in `CLSI M100 2024`.
2. **Specimen-agnostic organism-specific breakpoint** — same but no specimen filter.
3. **Group-level breakpoint** — `Enterobacterales` × `Ampicillin` × `MIC` in `CLSI M100 2024`.
4. **No match** — return `{ matched_by: NONE }`. M-05 then displays the raw MIC/zone with interpretation "Unable to interpret — no breakpoint" and prompts manual entry of S/I/R.

**Precedence is shown to the user in M-05 (review edit R-05).** The `matched_by` value is surfaced next to the run header / interpretation in M-05 — "matched: organism-specific" / "matched: group-level (Enterobacterales)" / "no standard breakpoint" — so the tech knows how specific the interpretation is and can trust (or question) it. M-02 owns the service contract; the user-facing display lives in M-05 §6.

### 7.3 Interpretation logic

For MIC values (`threshold_comparator = LE`):

- If MIC ≤ susceptible_threshold → S
- Else if MIC < resistant_threshold AND intermediate_threshold not null → I
- Else → R

For disk diffusion zones (`threshold_comparator = GE`):

- If zone ≥ susceptible_threshold → S
- Else if zone > resistant_threshold AND intermediate_threshold not null → I
- Else → R

Edge cases:

- Standard has S ≤ X, R ≥ Y with no I (S/R only): zone X+1 through Y-1 → I (computed) only if `intermediate_threshold` is set; otherwise return error.
- Lab-customized breakpoints flagged with `locally_customized = true` get a "custom" badge in M-04 AST result display so the supervisor knows the value isn't the publisher's default.

### 7.4 Critical-concentration interpretation (TB DST — WHO_TB standards)

`BreakpointLookupService` is extended for TB phenotypic DST. When the AST Run's interpretation method = **`CRITICAL_CONCENTRATION`** (set on TB DST runs — see M-14) and the chosen standard's publisher is `WHO_TB`, the service does **not** return an S/I/R threshold triad. Instead it looks up the **critical concentration** for `(M. tuberculosis complex [or organism], drug, method ∈ {MGIT, LJ, AGAR_PROPORTION}, breakpoint_standard_id)` and returns:

```
→ {
   critical_concentration: numeric,        // the CC value
   interpretation_model: CRITICAL_CONCENTRATION,
   units: text,                            // e.g., "ug/mL"
   matched_by: ORGANISM | GROUP | NONE,
   notes: text | null
}
```

The R/S call is binary: the measured/tested concentration **≥ critical concentration → Resistant**, otherwise **Susceptible**. There is no Intermediate category for TB CC interpretation. M-14 records the phenotypic R/S per drug × method on the TB DST run, snapshotting `breakpoint_standard_id` + `breakpoint_version` exactly as the bacterial path does.

**Molecular resistance is out of this service.** Xpert MTB/RIF and LPA results are genotypic R/S flags recorded on the isolate by M-14; they are **not** a breakpoint lookup (there is no concentration). The service is consulted only for phenotypic critical-concentration DST.

---

## 8. Import paths

### 8.1 Automated import (via the existing Catalog Subscription feature)

For connected sites, the existing **Catalog Subscription & Metadata Sync** feature pulls breakpoint sets (as FHIR `PlanDefinition`) from a EUCAST/WHO/national-ref-lab catalog or the OpenELIS Community Hub. New `breakpoint_standard` rows are added; new `breakpoint` rows populate; existing standards' `seeded = true` rows refresh from the source. **New standards land `status = Loaded`, never auto-active** — a lab manager activates them here in §8 (the "Activate in Breakpoint Catalog" hand-off). *(M-10's bespoke hub is retired — see m-10 v3.0; this path is Catalog Subscription + the offline §8.2 CSV import.)*

In Phase 1A — and at any offline site — breakpoint catalogs are seeded by the **initial deployment process** (data migration) and updated via the §8.2 file import, not an in-app pull.

### 8.2 Manual CSV import (Phase 1A)

In Phase 1A, the lab manager can import a CSV file of breakpoints. The file format:

```csv
publisher,version_label,version_year,organism_or_group,antibiotic_whonet_code,method,specimen_type,susceptible_threshold,intermediate_threshold,resistant_threshold,threshold_comparator,units,notes
CLSI,M100,2024,Enterobacterales,AMP,MIC,,8,16,32,LE,ug/mL,
CLSI,M100,2024,Enterobacterales,AMP,DISK_DIFFUSION,,17,16,13,GE,mm,
CLSI,M100,2024,Escherichia coli,CRO,MIC,urine,2,4,8,LE,ug/mL,Uncomplicated UTI
...
```

The CSV import:

- Validates each row (organism/group exists in M-01; antibiotic exists in M-01; method is valid; thresholds are numeric).
- Creates the `breakpoint_standard` row if it doesn't exist.
- Creates `breakpoint` rows for each valid line.
- Marks all imported rows as `seeded = true`.

**Row-level import errors (review edit R-04).** The import does not fail wholesale on a bad row. It validates every row, imports the valid ones, and presents a **per-row error summary** so the manager can fix and re-import only the failures. Each error names the row number and the specific cause, e.g.:

- *"Row 47: organism 'Burkhholderia' (typo) not found in Organism Master — skipped."*
- *"Row 88: antibiotic code 'XYZ' not in Antibiotic Master — skipped."*
- *"Row 102: susceptible_threshold 'n/a' is not numeric — skipped."*
- *"Row 119: method 'gradient' invalid (expected MIC / DISK_DIFFUSION / ETEST) — skipped."*

The summary shows a count ("1,243 of 1,247 rows imported; 4 skipped") with the skipped rows expandable, and offers a **download of the failed rows as CSV** for correction. Valid rows are committed regardless of the skipped ones.

Phase 1A: manual import is the bootstrap mechanism. Phase 1B: replaced/augmented by Hub.

### 8.3 Local edits

The lab can edit individual breakpoints (rare but supported). Local edits mark the row `locally_customized = true`. Hub updates do **not** overwrite locally customized rows; they're left alone with a warning surfaced to the lab manager: "X local customizations were preserved during Hub update; review here."

---

## 9. Standard activation workflow

From the list view (§4), the row action "Set as Active" opens a modal:

```
┌─ Set CLSI M100 2025 as active? ─────────────────────────────────────────────┐
│                                                                              │
│ This will make CLSI M100 2025 the default breakpoint standard for new AST   │
│ Runs setting up CLSI-based interpretation starting on the effective date    │
│ below.                                                                       │
│                                                                              │
│ Currently active CLSI standard: CLSI M100 2024                              │
│ This will be deactivated (status → Loaded).                                 │
│                                                                              │
│ Effective date: *  ┌───────────────┐                                         │
│                    │ 2026-06-01    📅│                                       │
│                    └───────────────┘                                         │
│ ⓘ New AST Runs created on or after this date default to CLSI M100 2025.     │
│    Runs before it, and runs already set up, are unaffected.                  │
│                                                                              │
│ Notes (optional):                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Transition after validation period 2026-05-01 to 2026-05-31              │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ AST Runs already set up against CLSI M100 2024 are NOT affected. Only       │
│ new AST Runs created on or after the effective date use CLSI M100 2025.     │
│                                                                              │
│ [Cancel]                                                       [Confirm]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

The effective-date helper (ⓘ) is the review-edit-H3 explanation of what the date controls.

On confirm:

1. `breakpoint_standard_activation_event` row written for both standards (old → DEACTIVATED, new → ACTIVATED).
2. `breakpoint_standard.is_active_for_publisher` flipped.
3. `breakpoint_standard.activation_effective_date` set on the new standard.
4. M-05 AST Setup modal default updates immediately for new AST Runs (the default standard for the publisher is reread on each AST setup); the tech can still pick any loaded version per run (§2.1).
5. A notification appears in the Admin landing page: "CLSI standard changed to M100 2025 effective 2026-06-01."

---

## 10. Side-by-side comparison (Phase 1B)

Phase 1B feature placeholder. Lab manager can pick two standards (typically the currently active and a candidate replacement) and see a diff:

- Breakpoints present in version A but not B
- Breakpoints with changed thresholds
- New organisms or antibiotics covered

The comparison view supports the validation period before a switchover. Not in Phase 1A scope; mention here so M-02 schema can support it.

---

## 11. Permissions

| Action | Permission |
|--------|-----------|
| View Breakpoint Catalog | `micro.breakpoint.view` |
| View individual breakpoint values | `micro.breakpoint.view` |
| Add / edit / delete / import / activate | `micro.breakpoint.manage` |

---

## 12. Acceptance criteria

- **AC-M02-01**: List view shows all standards with Active / Loaded / Archived statuses, a status-legibility banner, and per-badge tooltips (review edit H3).
- **AC-M02-02**: Activating a standard prompts for effective date, with helper text explaining the date controls only on-or-after runs; writes audit event; flips `is_active_for_publisher` (review edit H3).
- **AC-M02-03**: At most one Active standard per publisher at a time.
- **AC-M02-04**: Drilldown shows up to 50 breakpoints per page with search and filter; the detail header shows status tooltip + effective date.
- **AC-M02-05**: BreakpointLookupService returns correct precedence (specimen-specific > organism-specific > group-level > none).
- **AC-M02-06**: BreakpointLookupService returns `matched_by`; M-05 displays which precedence level matched next to the interpretation (review edit R-05).
- **AC-M02-07**: AST Run records the `breakpoint_standard_id` AND `breakpoint_version` (denormalized snapshot) at setup time; selection is flexible per run (default active, any loaded version selectable) per §2.1.
- **AC-M02-08**: After a standard transition, historical AST Runs against the prior version still show the original interpretation; the snapshot rule is stated in the list banner.
- **AC-M02-09**: CSV import validates every row, imports valid rows, surfaces per-row errors with row number + specific cause, and offers a failed-rows CSV download; rows marked `seeded = true` (review edit R-04).
- **AC-M02-10**: Locally customized rows survive Hub update; flagged with warning.
- **AC-M02-11**: Archive blocked if the standard has unresolved active AST Runs (warning: "X AST Runs in flight against this standard; complete or transition them first").
- **AC-M02-12**: All actions respect `micro.breakpoint.view` and `micro.breakpoint.manage`.
- **AC-M02-13**: Empty state renders before any standard is loaded.
- **AC-M02-14**: WHO TB critical-concentration standards (publisher `WHO_TB`, e.g., WHO TB 2021 / 2023) load, version, activate (with effective date), and snapshot onto TB DST runs using the identical Active/Loaded/Archived + per-run snapshot machinery as CLSI/EUCAST; CC rows are stored per drug × method (MGIT / LJ / AGAR_PROPORTION) with `interpretation_model = CRITICAL_CONCENTRATION`.
- **AC-M02-15**: When an AST Run's interpretation method = `CRITICAL_CONCENTRATION` (TB DST per M-14), `BreakpointLookupService` returns the critical concentration and a binary R/S (R if tested concentration ≥ CC, else S; no Intermediate); molecular resistance (Xpert/LPA) is recorded by M-14 as a genotypic flag and is **not** a breakpoint lookup.

---

## 13. i18n keys

Estimated 35-45 keys. Pattern:

```
admin.micro.breakpoint.list.title              "Breakpoint Standards"
admin.micro.breakpoint.list.column.name        "Name"
admin.micro.breakpoint.list.column.publisher   "Publisher"
admin.micro.breakpoint.list.column.activeBadge "Active"
admin.micro.breakpoint.list.column.loadedBadge "Loaded"
admin.micro.breakpoint.list.column.archivedBadge "Archived"
admin.micro.breakpoint.list.statusBanner       "Active = default for new runs · Loaded = selectable, not default · Archived = historical only. Historical runs keep their version forever."
admin.micro.breakpoint.status.active.tooltip   "Default for new AST Runs against this publisher."
admin.micro.breakpoint.status.loaded.tooltip   "Selectable per run, but not the publisher's default."
admin.micro.breakpoint.status.archived.tooltip "Historical only — cannot be chosen for new runs."
admin.micro.breakpoint.list.action.setActive   "Set as Active"
admin.micro.breakpoint.list.action.archive     "Archive"
admin.micro.breakpoint.list.action.import      "Import"
admin.micro.breakpoint.list.empty              "No breakpoint standards loaded. Import a CLSI or EUCAST table (CSV) to begin."
admin.micro.breakpoint.detail.header.breakpoints "{{count}} breakpoints"
admin.micro.breakpoint.detail.effectiveDate    "Effective {{date}}"
admin.micro.breakpoint.detail.column.method.mic "MIC"
admin.micro.breakpoint.detail.column.method.disk "Disk"
admin.micro.breakpoint.detail.column.method.etest "Etest"
admin.micro.breakpoint.detail.threshold.le     "≤"
admin.micro.breakpoint.detail.threshold.ge     "≥"
admin.micro.breakpoint.activate.modal.title    "Set {{name}} as active?"
admin.micro.breakpoint.activate.modal.effectiveDate "Effective date"
admin.micro.breakpoint.activate.modal.effectiveDate.helper "New AST Runs created on or after this date default to the new version. Runs before it, and runs already set up, are unaffected."
admin.micro.breakpoint.activate.modal.helper   "AST Runs already set up against the current standard are not affected."
admin.micro.breakpoint.import.modal.title      "Import breakpoints"
admin.micro.breakpoint.import.csv.helper       "Upload a CSV file matching the breakpoint catalog schema"
admin.micro.breakpoint.import.row.error        "Row {{row}}: {{message}}"
admin.micro.breakpoint.import.summary          "{{imported}} of {{total}} rows imported; {{skipped}} skipped"
admin.micro.breakpoint.import.downloadErrors   "Download skipped rows (CSV)"
admin.micro.breakpoint.locallyCustomized.tooltip "This breakpoint was edited locally and differs from the imported value"
admin.micro.breakpoint.matchedBy.organism      "Matched: organism-specific"
admin.micro.breakpoint.matchedBy.group         "Matched: group-level ({{group}})"
admin.micro.breakpoint.matchedBy.none          "No standard breakpoint — interpret per local SOP"
...
```

---

## 14. Open verification items

- Confirm the existing audit infrastructure can hold `breakpoint_standard_activation_event` rows; if not, M-02 builds.
- Confirm CSV import path conventions in OE (any existing bulk-import patterns to follow).

---

## 15. References

- M-00 Microbiology Module Parent Specification
- M-01 AMR Reference Data (for organism / antibiotic FK targets)
- M-05 AST Entry & Interpretation (primary consumer; displays `matched_by` precedence and the per-run standard picker)
- M-04 Case Workbench Core (records breakpoint_standard_id + version on AST Run)
- Catalog Subscription & Metadata Sync (automated breakpoint import; M-10 retired)
- `amr-crosswalk-working.md` Q4 (versioning rules)
- `amr-pre-frs-planning-v1.md` §4 (versioning + time edge cases)
- CLSI M100 reference standard (current version)
- EUCAST clinical breakpoints reference
- WHO technical report on critical concentrations for TB DST (WHO TB 2021 / 2023 guidance)
- M-14 Mycobacteriology / TB (consumer of CRITICAL_CONCENTRATION interpretation; owns molecular Xpert/LPA flags)
