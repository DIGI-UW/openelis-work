# M-02 Breakpoint Catalog — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Admin → Breakpoint Catalog
**Phase:** 1A
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec covers the versioned reference catalog of breakpoint tables — CLSI M100 (annually updated) and EUCAST clinical breakpoints (versioned). The catalog drives AST interpretation (MIC or zone → S/I/R) in M-05 and is version-aware: AST Runs snapshot the breakpoint version at result time so subsequent publisher updates don't retroactively change historical interpretations.

---

## 1. Overview

### 1.1 Purpose

Hold the lab's set of breakpoint reference standards. Multiple versions of each standard coexist (CLSI 2024, CLSI 2025, EUCAST v14.0, EUCAST v14.1) so the lab can transition between versions on its own schedule. The `BreakpointLookupService` (called by M-05) takes (organism, antibiotic, method, breakpoint_standard_id) and returns S/I/R thresholds.

### 1.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| Breakpoint Standards list | `/admin/microbiology/breakpoint-catalog` | Admin → Breakpoint Catalog |
| Standard detail / breakpoint table view | `/admin/microbiology/breakpoint-catalog/:standardId` | (drilldown from list) |
| Add / Edit Breakpoint Standard | (modal) | — |
| Import breakpoints (from CSV or Hub) | (modal) | — |

### 1.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Full CRUD; activate / deactivate versions; import |
| Microbiology Supervisor | View; cannot modify breakpoints |
| System Administrator | All actions |

### 1.4 Integration

- **M-01 Reference Data** — breakpoints FK to `organism_master` (or `organism_group` for group-level breakpoints) and `antibiotic_master`.
- **M-05 AST Entry & Interpretation** — calls `BreakpointLookupService(organism_id, antibiotic_id, method, breakpoint_standard_id)`. Returns S, I, R thresholds.
- **M-04 Case Workbench** — AST Run header records `breakpoint_standard_id` + `breakpoint_version` at setup time. Snapshots survive subsequent catalog changes.
- **M-09 WHONET Export** — writes `breakpoint_standard` value (e.g., `CLSI_M100_2024`) into each exported AST result column.
- **M-10 Hub Subscription** (Phase 1B) — provides automated import of new standard versions from a central repository.

---

## 2. Versioning model

This is the heart of M-02. Two principles:

### 2.1 Reference standards are versioned

A `breakpoint_standard` row represents one **version** of one publisher's standard. Examples:

- `CLSI M100 2024` (publisher: CLSI, version: M100, year: 2024)
- `CLSI M100 2025` (publisher: CLSI, version: M100, year: 2025)
- `EUCAST v14.0` (publisher: EUCAST, version: 14.0, year: 2024)
- `EUCAST v14.1` (publisher: EUCAST, version: 14.1, year: 2024)

Each standard owns many `breakpoint` rows. The breakpoints **only apply within that version of that standard**. The same (organism, antibiotic) pair may have different thresholds in CLSI 2024 vs. CLSI 2025; both rows coexist in the catalog.

### 2.2 Results snapshot the version at write time

Per crosswalk Q4 Rule 1:

> When AST is interpreted, the AST Run row records `breakpoint_standard_id` and `breakpoint_version`. The interpretation is computed against that version. **Future updates to the standard do not retroactively change historical AST interpretations.**

So:

- A Case finalized on 2024-12-15 with `breakpoint_standard_id = CLSI_M100_2024` has its AST Results interpreted against CLSI 2024 forever, even after the lab transitions to CLSI 2025.
- The lab can read the historical Case and see the original interpretation that the clinician acted on.
- WHONET exports of that AST Run show `breakpoint_standard = CLSI_M100_2024` so the receiving aggregator knows which standard was applied.

### 2.3 The lab's "active" standard

For each publisher (CLSI, EUCAST, other), the lab has zero or one **active** standard at a time. The active standard is the one M-05's `BreakpointLookupService` defaults to for new AST Runs. The lab can have CLSI 2024 active for one period and switch to CLSI 2025 active at a controlled point.

Switching the active standard is a deliberate admin action:

- A lab manager opens M-02, selects the new standard version.
- The system prompts: "Set [CLSI M100 2025] as the active CLSI standard for new AST Runs starting [date]?"
- Lab manager confirms with effective date.
- A `breakpoint_standard_activation_event` row is written (audit).
- The new standard becomes the default for AST setups dated on or after the effective date.

The lab can run a validation period where both standards are loaded but only one is active — useful for side-by-side runs against both before flipping over.

### 2.4 Multiple publishers in parallel

Most labs use one publisher's breakpoints (CLSI in the US, EUCAST in Europe and most WHO-supported settings). Some labs deliberately use both — e.g., a country where the national reference lab follows EUCAST but a national-tier hospital follows CLSI for chemistry parity.

M-02 supports having **both an active CLSI standard and an active EUCAST standard** simultaneously. The AST Setup modal in M-04 lets the tech pick which standard to interpret against per AST Run. Default is per the active-standard-for-this-publisher logic.

---

## 3. List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Breakpoint Catalog                                                   │
│                                                                              │
│ Breakpoint Standards                          [Import]  [+ Add New Version]  │
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

Status values:

- **Active** — this is the default for new AST Runs against this publisher.
- **Loaded** — present in catalog, available for selection, but not the publisher's default.
- **Archived** — preserved for historical reference; cannot be selected for new AST Runs (only referenced by old ones).

Row actions (overflow menu):

- View Breakpoints (drilldown)
- Set as Active (only if status is Loaded)
- Archive (only if not currently active; warns about historical Case references)
- Export to CSV
- Compare with [other version] (Phase 1B feature; placeholder in 1A)

---

## 4. Breakpoint Standard detail view

Clicking a row from §3 drills into the standard's detail page.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Breakpoint Catalog / CLSI M100 2024                                  │
│                                                                              │
│ CLSI M100 2024                                                               │
│ Publisher: CLSI · Year: 2024 · Status: Active · 1,247 breakpoints           │
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

**Carbon components:** `DataTable` with TableToolbar (search + filters), `Pagination`. Edit / Add / Delete actions on rows for individual breakpoint adjustments.

**Filters:**

- Organism (ComboBox referencing Organism Master + Organism Groups)
- Antibiotic class (Dropdown)
- Method (DISK_DIFFUSION / MIC)

Most labs **don't edit individual breakpoints**. The CLSI / EUCAST tables come as imports; modifying them locally is reserved for the very rare lab-specific customization. The list is mostly read-only browsing.

---

## 5. Breakpoint data model

```
breakpoint_standard
├── standard_id (UUID PK)
├── name (text, e.g., "CLSI M100 2024")
├── publisher (enum: CLSI, EUCAST, OTHER)
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
├── antibiotic_id (FK to antibiotic_master)
├── method (enum: DISK_DIFFUSION, MIC, ETEST)
├── specimen_type_filter (FK to sample type, nullable — e.g., urine-specific breakpoint)
├── susceptible_threshold (numeric)
├── intermediate_threshold (numeric, nullable — for S/R-only entries)
├── resistant_threshold (numeric)
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

## 6. BreakpointLookupService

The service called by M-05 (and any future module that needs to interpret AST values).

### 6.1 Signature

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

### 6.2 Lookup precedence

The service walks through possible matches in this order:

1. **Specimen-specific organism-specific breakpoint** — most specific. Example: `Escherichia coli` × `Ceftriaxone` × `MIC` × specimen filter `urine` in `CLSI M100 2024`.
2. **Specimen-agnostic organism-specific breakpoint** — same but no specimen filter.
3. **Group-level breakpoint** — `Enterobacterales` × `Ampicillin` × `MIC` in `CLSI M100 2024`.
4. **No match** — return `{ matched_by: NONE }`. M-05 then displays the raw MIC/zone with interpretation "Unable to interpret — no breakpoint" and prompts manual entry of S/I/R.

### 6.3 Interpretation logic

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

---

## 7. Import paths

### 7.1 Hub import (Phase 1B via M-10)

The dominant case. M-10 Hub Subscription pulls structured breakpoint tables from the central repository. New `breakpoint_standard` rows are added; new `breakpoint` rows populate; existing standards' `seeded = true` rows refresh from the source.

In Phase 1A, breakpoint catalogs are seeded by the **initial deployment process** (data migration), not by an in-app Hub call. The Hub UI is built in Phase 1B per M-10.

### 7.2 Manual CSV import (Phase 1A)

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
- Reports errors per row (e.g., "Row 47: organism 'Burkhholderia' (typo) not found — skipped").
- Marks all imported rows as `seeded = true`.

Phase 1A: manual import is the bootstrap mechanism. Phase 1B: replaced/augmented by Hub.

### 7.3 Local edits

The lab can edit individual breakpoints (rare but supported). Local edits mark the row `locally_customized = true`. Hub updates do **not** overwrite locally customized rows; they're left alone with a warning surfaced to the lab manager: "X local customizations were preserved during Hub update; review here."

---

## 8. Standard activation workflow

From the list view (§3), the row action "Set as Active" opens a modal:

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

On confirm:

1. `breakpoint_standard_activation_event` row written for both standards (old → DEACTIVATED, new → ACTIVATED).
2. `breakpoint_standard.is_active_for_publisher` flipped.
3. `breakpoint_standard.activation_effective_date` set on the new standard.
4. M-05 AST Setup modal default updates immediately for new AST Runs (the default standard for the publisher is reread on each AST setup).
5. A notification appears in the Admin landing page: "CLSI standard changed to M100 2025 effective 2026-06-01."

---

## 9. Side-by-side comparison (Phase 1B)

Phase 1B feature placeholder. Lab manager can pick two standards (typically the currently active and a candidate replacement) and see a diff:

- Breakpoints present in version A but not B
- Breakpoints with changed thresholds
- New organisms or antibiotics covered

The comparison view supports the validation period before a switchover. Not in Phase 1A scope; mention here so M-02 schema can support it.

---

## 10. Permissions

| Action | Permission |
|--------|-----------|
| View Breakpoint Catalog | `micro.breakpoint.view` |
| View individual breakpoint values | `micro.breakpoint.view` |
| Add / edit / delete / import / activate | `micro.breakpoint.manage` |

---

## 11. Acceptance criteria

- **AC-M02-01**: List view shows all standards with Active / Loaded / Archived statuses.
- **AC-M02-02**: Activating a standard prompts for effective date; writes audit event; flips `is_active_for_publisher`.
- **AC-M02-03**: At most one Active standard per publisher at a time.
- **AC-M02-04**: Drilldown shows up to 50 breakpoints per page with search and filter.
- **AC-M02-05**: BreakpointLookupService returns correct precedence (specimen-specific > organism-specific > group-level > none).
- **AC-M02-06**: BreakpointLookupService returns `matched_by` so M-05 can render confidence appropriately.
- **AC-M02-07**: AST Run records the `breakpoint_standard_id` AND `breakpoint_version` (denormalized snapshot) at setup time.
- **AC-M02-08**: After a standard transition, historical AST Runs against the prior version still show the original interpretation in Case detail views.
- **AC-M02-09**: CSV import validates every row, surfaces errors per row, creates `seeded = true` rows.
- **AC-M02-10**: Locally customized rows survive Hub update; flagged with warning.
- **AC-M02-11**: Archive blocked if the standard has unresolved active AST Runs (warning: "X AST Runs in flight against this standard; complete or transition them first").
- **AC-M02-12**: All actions respect `micro.breakpoint.view` and `micro.breakpoint.manage`.

---

## 12. i18n keys

Estimated 35-45 keys. Pattern:

```
admin.micro.breakpoint.list.title              "Breakpoint Standards"
admin.micro.breakpoint.list.column.name        "Name"
admin.micro.breakpoint.list.column.publisher   "Publisher"
admin.micro.breakpoint.list.column.activeBadge "Active"
admin.micro.breakpoint.list.column.loadedBadge "Loaded"
admin.micro.breakpoint.list.column.archivedBadge "Archived"
admin.micro.breakpoint.list.action.setActive   "Set as Active"
admin.micro.breakpoint.list.action.archive     "Archive"
admin.micro.breakpoint.list.action.import      "Import"
admin.micro.breakpoint.detail.header.breakpoints "{{count}} breakpoints"
admin.micro.breakpoint.detail.column.method.mic "MIC"
admin.micro.breakpoint.detail.column.method.disk "Disk"
admin.micro.breakpoint.detail.column.method.etest "Etest"
admin.micro.breakpoint.detail.threshold.le     "≤"
admin.micro.breakpoint.detail.threshold.ge     "≥"
admin.micro.breakpoint.activate.modal.title    "Set {{name}} as active?"
admin.micro.breakpoint.activate.modal.effectiveDate "Effective date"
admin.micro.breakpoint.activate.modal.helper   "AST Runs already set up against the current standard are not affected."
admin.micro.breakpoint.import.modal.title      "Import breakpoints"
admin.micro.breakpoint.import.csv.helper       "Upload a CSV file matching the breakpoint catalog schema"
admin.micro.breakpoint.import.row.error        "Row {{row}}: {{message}}"
admin.micro.breakpoint.locallyCustomized.tooltip "This breakpoint was edited locally and differs from the imported value"
...
```

---

## 13. Open verification items

- Confirm the existing audit infrastructure can hold `breakpoint_standard_activation_event` rows; if not, M-02 builds.
- Confirm CSV import path conventions in OE (any existing bulk-import patterns to follow).

---

## 14. References

- M-00 Microbiology Module Parent Specification
- M-01 AMR Reference Data (for organism / antibiotic FK targets)
- M-05 AST Entry & Interpretation (primary consumer)
- M-04 Case Workbench Core (records breakpoint_standard_id + version on AST Run)
- M-10 Hub Subscription (Phase 1B; provides automated import)
- `amr-crosswalk-working.md` Q4 (versioning rules)
- `amr-pre-frs-planning-v1.md` §4 (versioning + time edge cases)
- CLSI M100 reference standard (current version)
- EUCAST clinical breakpoints reference
