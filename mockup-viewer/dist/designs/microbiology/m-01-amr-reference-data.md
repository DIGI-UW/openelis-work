# M-01 AMR Reference Data — Functional Requirements Specification

> Functional authority: the V2 baseline owns case behavior; this document owns its scoped laboratory outcomes. Technical examples are non-normative. Engineering decisions and verification belong to specs/amr.


**Version:** 2.0 (consolidated — folds review edits inline; no separate addendum)
**Date:** 2026-06-07
**Module:** Admin → Microbiology Reference Data
**Phase:** 1A
**Owner:** Microbiology Module ([V2 baseline](amr-micro-v2-amendments.md) parent)
**Status:** Draft

> This FRS is self-contained. The clarity/legibility edits from the AMR design review (downstream-effect helper text, the "Initial significance" rename, cascade-tier info, deactivation impact, empty states, and AST-panel version toast) are written **inline** in the relevant sections below — there is no separate edits doc or addendum.

This spec covers the reference data that drives the Micro workflow: the **Organism Master, Antibiotic Master, and AST Panels** (three new masters under `Admin → Microbiology Reference Data`, sidenav submenus per `feedback_openelis_sidenav_submenus`).

This is the foundation that M-02 Breakpoint Catalog, [V2 case](amr-micro-v2-amendments.md#fr-17.6) Case Workbench, [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Entry, and M-09 WHONET Export all reference.

---

## 1. Lab Context

**Current State.** A small clinical lab keeps its organism list, antibiotic list, which drugs to test for which bugs, and its culture recipes in someone's head, on a wall chart, or in a spreadsheet that drifts out of date. WHONET surveillance codes, when used, are looked up by hand at export time.

**Pain.** Because the vocabularies aren't a single source of truth, the same organism gets spelled three ways, an antibiotic is tested but has no breakpoint loaded, and a tech setting up AST has to remember which panel applies to which organism. Nothing tells the configuring manager what a field actually *does downstream* — e.g., that "intrinsic resistance" silently forces an R in AST, or that a default panel pre-selects at setup.

**What Changes.** Three admin masters become the canonical vocabularies. Each editable field now carries **inline helper text that names its downstream effect**, so a manager configuring a record sees where it lands in the workflow. Day-to-day workflow consumes these masters but never modifies them.

---

## 2. Overview

### 2.1 Purpose

Maintain the three reference-data vocabularies that power Micro:

- **Organism Master** — every organism the lab can identify, with WHONET codes for surveillance and groupings for rule application.
- **Antibiotic Master** — every antibiotic the lab can test, with WHONET codes and classification.
- **AST Panels** — which antibiotics get tested against which organism × specimen combinations, with tier ordering for cascade reporting.

These are admin-only surfaces. Day-to-day workflow consumes them but doesn't modify them.

### 2.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| Organism Master list | `/admin/microbiology/organisms` | Admin → Microbiology Reference Data → Organisms |
| Antibiotic Master list | `/admin/microbiology/antibiotics` | Admin → Microbiology Reference Data → Antibiotics |
| AST Panels list | `/admin/microbiology/ast-panels` | Admin → Microbiology Reference Data → AST Panels |
| Add/Edit modals | (modal overlay on respective list views) | — |

### 2.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Full CRUD on all four masters |
| Microbiology Supervisor | View all; edit Notes fields only |
| Microbiology Technician | View all; no edit |
| System Administrator | All actions |

### 2.4 Integration

- **M-02 Breakpoint Catalog** consumes Organism Master and Antibiotic Master as FK targets.
- **[V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Entry** consumes AST Panels + Antibiotic Master.
- **M-09 WHONET Export** reads WHONET codes from Organism Master, Antibiotic Master, and the Specimen Type and Origin coded vocabularies (latter two extend existing OE vocabularies — see Q7 in `amr-crosswalk-working.md`).

---

## 3. Organism Master

### 3.1 Purpose

The single source of truth for organism identities. Carries WHONET surveillance codes, organism group memberships, intrinsic resistances, and the default AST Panel suggestion. Micro Tests in the Test Catalog reference this master to declare valid organism results (per crosswalk Q6: reuses the existing test → coded-result-vocabulary mechanism).

### 3.2 List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Microbiology Reference Data / Organisms                              │
│                                                                              │
│ Organism Master                                                  [+ Add New] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search organisms...]   Group: [All ▼]   Status: [Active ▼]                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Scientific Name           │ WHONET │ Group            │ Gram │ Default panel │ Status │ ⋮ │
├───────────────────────────┼────────┼──────────────────┼──────┼───────────────┼────────┼───┤
│ Escherichia coli          │ eco    │ Enterobacterales │ Neg  │ GN-STD        │ Active │ ⋮ │
│ Klebsiella pneumoniae     │ kpn    │ Enterobacterales │ Neg  │ GN-STD        │ Active │ ⋮ │
│ Staphylococcus aureus     │ sau    │ Staphylococcus   │ Pos  │ GP-AST        │ Active │ ⋮ │
│ Staphylococcus epidermidis│ sep    │ Staph (CoNS)     │ Pos  │ GP-AST        │ Active │ ⋮ │
│ Pseudomonas aeruginosa    │ pae    │ Non-fermenter    │ Neg  │ PSEUDO        │ Active │ ⋮ │
│ Streptococcus pneumoniae  │ spn    │ Streptococcus    │ Pos  │ STREP         │ Active │ ⋮ │
│ Enterococcus faecalis     │ efa    │ Enterococcus     │ Pos  │ GP-ENT        │ Active │ ⋮ │
│ Candida albicans          │ cal    │ Yeast            │ —    │ —             │ Active │ ⋮ │
└───────────────────────────┴────────┴──────────────────┴──────┴───────────────┴────────┴───┘
  Showing 1-50 of 342   [< 1 2 3 ... 7 >]
```

The list surfaces the **Default panel** column so a manager can see, without opening each record, which AST panel pre-selects at set-up for that organism (review edit H1).

**Carbon components:** `DataTable` with `TableToolbar` (search + filter), `Pagination`, `OverflowMenu` for row actions.

**Row actions (overflow menu):** Edit · Duplicate · Deactivate (or Activate if currently inactive) · Delete (only if not referenced anywhere).

**Filters:**
- Group dropdown (All, Enterobacterales, Staphylococcus, Staph CoNS, Streptococcus, Enterococcus, Non-fermenter, Anaerobe, Yeast, Mycobacterium, Other)
- Status dropdown (Active, Inactive, All)
- Search by scientific name, common name, or WHONET code (case-insensitive substring)

**Empty state.** When no organisms match (or the master is empty on a fresh deployment): "No organisms yet. **+ Add New** to define one, or seed the standard list from WHONET." When seeded from WHONET, records carry `seeded = true` and the empty-state CTA is replaced by the list.

### 3.3 Data model

| Field | Type | Required | Validation | Notes (downstream effect) |
|-------|------|----------|-----------|-------|
| `organism_id` | UUID PK | — | — | System-generated |
| `scientific_name` | text | Yes | Unique across active records, ≤ 200 chars | E.g., "Escherichia coli" |
| `common_name` | text | No | ≤ 200 chars | E.g., "E. coli" |
| `whonet_code` | text | Yes | Unique, 3-5 lowercase chars, alphanumeric | Per WHONET organism list; written into M-09 surveillance export |
| `organism_group_id` | FK | Yes | FK to `organism_group` | **Used for expert-rule application** (M-06) — the group, not the species, is what expert rules match on |
| `gram_stain` | enum | No | POSITIVE / NEGATIVE / VARIABLE / NA | |
| `morphology` | enum | No | COCCI / BACILLI / COCCOBACILLI / YEAST / OTHER | |
| `oxygen_requirement` | enum | No | AEROBIC / ANAEROBIC / FACULTATIVE / MICROAEROPHILIC | |
| `initial_significance` | enum | Yes | ALWAYS / USUALLY / SOMETIMES / RARELY / CONTAMINANT | **Pre-fills the isolate's significance** on first creation in [V2 case](amr-micro-v2-amendments.md#fr-17.6); tech can override per case. (Renamed from "Clinical Significance Default" per review edit H1.) |
| `default_ast_panel_id` | FK | No | FK to `ast_panel` | **Pre-selected at AST set-up** in [V2 case](amr-micro-v2-amendments.md#fr-17.6) when this organism is the isolate's organism |
| `intrinsic_resistances` | M:N to antibiotic_master | No | — | Junction table; antibiotics this organism is always resistant to. **Auto-set R in AST regardless of MIC/zone** (review edit H1) |
| `active` | bool | Yes | Default true | Soft delete |
| `seeded` | bool | Yes | Default false | True if seeded from WHONET / Catalog Subscription |
| `notes` | text | No | ≤ 1000 chars | Clinical or procedural notes |
| `created_at`, `created_by`, `last_updated_at`, `last_updated_by` | audit | — | — | Standard audit columns |

### 3.4 Organism Groups

A small fixed-set vocabulary that drives Expert Rule application. Stored in `organism_group` table; seed data only (no admin CRUD in Phase 1A — groups change only via Hub or schema migration):

| Group | Examples | Notes |
|-------|----------|-------|
| Enterobacterales | E. coli, Klebsiella spp., Enterobacter spp., Proteus spp., Serratia spp., Citrobacter spp. | Gram-negative enteric |
| Staphylococcus | S. aureus | Coagulase-positive |
| Staphylococcus (CoNS) | S. epidermidis, S. saprophyticus, S. haemolyticus | Coagulase-negative |
| Streptococcus | S. pneumoniae, S. pyogenes, S. agalactiae, viridans group | Beta/alpha hemolytic |
| Enterococcus | E. faecalis, E. faecium | VRE considerations |
| Non-fermenter | P. aeruginosa, Acinetobacter spp., Stenotrophomonas | Glucose non-fermenters |
| Anaerobe | Bacteroides, Clostridium, Peptostreptococcus | Strict anaerobes |
| Yeast | Candida spp., Cryptococcus spp. | Fungal — Phase 1B/2 |
| Mycobacterium | M. tuberculosis, NTM | Phase 4+ ([V2 DST](amr-micro-v2-amendments.md#fr-14.1)) |
| HACEK | Haemophilus, Aggregatibacter, Cardiobacterium, Eikenella, Kingella | Slow growers |
| Other | — | Catch-all |

### 3.5 Add / Edit modal

`ComposedModal` size `lg`. Two-column layout for top half; full-width for notes and intrinsic resistances.

**Top section — identity:**

- Scientific Name (TextInput, required)
- Common Name (TextInput)
- WHONET Code (TextInput, required, helper text "3-5 lowercase chars")
- Organism Group (Dropdown, required) — helper text: *"Used for expert-rule application — expert rules (M-06) match on the group, not the individual species."*

**Middle section — characteristics:**

- Gram Stain (Dropdown)
- Morphology (Dropdown)
- Oxygen Requirement (Dropdown)
- **Initial significance** (Dropdown, required) — helper text: *"Pre-fills the isolate's significance when growth is recorded in the case; the tech can override per case."* (Field renamed from "Clinical Significance Default" per review edit H1.)

**Bottom section — workflow defaults:**

- Default AST Panel (ComboBox, searchable across active panels) — helper text: *"Pre-selected at AST set-up for isolates of this organism."*
- Intrinsic Resistances (MultiSelect from active antibiotics) — helper text: *"Antibiotics this organism is always resistant to — auto-set to R in AST regardless of the MIC/zone result."*

**Footer:**

- Notes (TextArea, ≤ 1000 chars)
- Status toggle: Active / Inactive
- Cancel · Save (primary)

**Validation on save:**

- WHONET code unique among active records
- Scientific name unique among active records
- Required fields populated

### 3.6 Delete vs. Deactivate

- **Deactivate** is the default. Removes the organism from selection dropdowns in workflow surfaces but preserves all historical Isolate references. Deactivated records visible in admin list with `Status: Inactive` filter. The deactivate confirmation states the **downstream impact** plainly: *"This organism will no longer appear in Isolate-ID pickers or as an AST default. Historical cases keep it. Reactivate any time."*
- **Delete** is only allowed if no Isolate, Breakpoint, or AST Panel references the record. Confirmation dialog warns the user. Deletion is hard; no undo.

### 3.7 Import reference-data updates (via Catalog Subscription)

Reference-data updates arrive through the existing **Catalog Subscription & Metadata Sync** feature (shared catalog administration owns updates). When a subscribed catalog has organism/antibiotic updates, the admin reviews a field-level diff and applies it: local additions are preserved; remote updates apply to records where `seeded = true` only. *(Open: organism/antibiotic master may need a dedicated catalog resource type — tracked with the Catalog Subscription owner.)*

In Phase 1A the list is **seeded from WHONET** at deployment (`seeded = true`); reference-data updates later flow through the existing Catalog Subscription feature (no separate Hub button — M-10 retired).

### 3.8 Acceptance criteria

- **AC-M01-O-01**: List view renders all active organisms with pagination at 50 per page.
- **AC-M01-O-02**: Search filters by scientific name, common name, or WHONET code, case-insensitive substring.
- **AC-M01-O-03**: Group and Status filters reduce the list appropriately.
- **AC-M01-O-04**: Add modal validates WHONET code format (3-5 lowercase alphanumeric).
- **AC-M01-O-05**: Add modal rejects duplicate WHONET codes among active records.
- **AC-M01-O-06**: Edit modal pre-populates all fields from the selected record.
- **AC-M01-O-07**: Intrinsic Resistances MultiSelect references active antibiotics only.
- **AC-M01-O-08**: Deactivating an organism hides it from workflow dropdowns but keeps it visible in admin list; the confirmation states the downstream impact.
- **AC-M01-O-09**: Delete attempt on a referenced organism is blocked with a clear error.
- **AC-M01-O-10**: All actions respect `micro.ref.view` / `micro.ref.manage` permissions.
- **AC-M01-O-11**: The significance field is labelled **"Initial significance"** with helper text describing the isolate pre-fill; Organism Group, Intrinsic Resistances, and Default AST Panel each carry downstream-effect helper text (review edit H1).
- **AC-M01-O-12**: The list view shows a **Default panel** column (review edit H1).
- **AC-M01-O-13**: Empty / seeded states render per §3.2 ("seeded from WHONET" on fresh deployment).

---

## 4. Antibiotic Master

### 4.1 Purpose

The single source of truth for antibiotic identities. Carries WHONET surveillance codes and classification. Referenced by Breakpoint Catalog, AST Panels, and Expert Rules.

### 4.2 List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Microbiology Reference Data / Antibiotics                            │
│                                                                              │
│ Antibiotic Master                                                [+ Add New] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search antibiotics...]   Class: [All ▼]   Status: [Active ▼]                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Name                  │ WHONET │ Class            │ Route │ Status │ Actions│
├───────────────────────┼────────┼──────────────────┼───────┼────────┼────────┤
│ Ampicillin            │ AMP    │ Aminopenicillin  │ Both  │ Active │ ⋮      │
│ Amoxicillin/Clavulan. │ AMC    │ BL/BLI           │ Oral  │ Active │ ⋮      │
│ Cefazolin             │ CFZ    │ Cephalosporin 1G │ IV    │ Active │ ⋮      │
│ Ceftriaxone           │ CRO    │ Cephalosporin 3G │ IV    │ Active │ ⋮      │
│ Meropenem             │ MEM    │ Carbapenem       │ IV    │ Active │ ⋮      │
│ Ciprofloxacin         │ CIP    │ Fluoroquinolone  │ Both  │ Active │ ⋮      │
│ Vancomycin            │ VAN    │ Glycopeptide     │ IV    │ Active │ ⋮      │
│ Trimethoprim/Sulfa.   │ SXT    │ Folate inhibitor │ Both  │ Active │ ⋮      │
└───────────────────────┴────────┴──────────────────┴───────┴────────┴────────┘
  Showing 1-50 of ~120   [< 1 2 3 >]
```

**Empty state.** Fresh deployment: "No antibiotics yet. **+ Add New**, or seed the standard list from WHONET." Seeded records carry `seeded = true`.

### 4.3 Data model

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `antibiotic_id` | UUID PK | — | — |
| `name` | text | Yes | Unique, ≤ 100 chars |
| `whonet_code` | text | Yes | Unique, 3-4 uppercase chars, alphanumeric |
| `antibiotic_class` | text | Yes | From class vocabulary (Aminoglycoside, Carbapenem, Cephalosporin 1G..5G, Fluoroquinolone, Glycopeptide, Macrolide, Oxazolidinone, Penicillin, BL/BLI [Beta-lactam / Beta-lactamase inhibitor], Tetracycline, Aminopenicillin, Folate inhibitor, Polymyxin, Other) |
| `route` | enum | Yes | ORAL / IV / BOTH / TOPICAL |
| `active` | bool | Yes | Default true |
| `seeded` | bool | Yes | Default false |
| `notes` | text | No | ≤ 500 chars |
| audit columns | — | — | — |

### 4.4 Add / Edit modal

Smaller than Organism — single column.

- Name (TextInput, required)
- WHONET Code (TextInput, required, helper "3-4 uppercase chars")
- Antibiotic Class (Dropdown, required)
- Route (RadioButtonGroup: Oral / IV / Both / Topical)
- Active / Inactive toggle
- Notes (TextArea)

### 4.5 Acceptance criteria

- **AC-M01-A-01**: List, search, filter, pagination as for Organism Master.
- **AC-M01-A-02**: WHONET code uniqueness validated.
- **AC-M01-A-03**: Antibiotic Class dropdown limited to enumerated values.
- **AC-M01-A-04**: Deactivation removes antibiotic from AST Panels' antibiotic selection but preserves historical AST results; the confirmation states this downstream impact.
- **AC-M01-A-05**: Delete blocked if referenced.
- **AC-M01-A-06**: Empty / seeded states render ("seeded from WHONET" on fresh deployment).

---

## 5. AST Panels

### 5.1 Purpose

Define which antibiotics get tested for which organism × specimen combinations. Drives the AST Setup defaults in [V2 case](amr-micro-v2-amendments.md#fr-17.6). Carries tier information for cascade reporting in M-06.

### 5.2 List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Microbiology Reference Data / AST Panels                             │
│                                                                              │
│ AST Panels                                                       [+ Add New] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search panels...]   Organism Group: [All ▼]   Status: [Active ▼]            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Code   │ Name                       │ Target Group       │ # Abx │ Status   │
├────────┼────────────────────────────┼────────────────────┼───────┼──────────┤
│ GN-STD │ Gram-negative standard     │ Enterobacterales   │ 16    │ Active   │
│ GN-UR  │ Gram-negative urinary      │ Enterobacterales   │ 8     │ Active   │
│ GP-AST │ Gram-positive standard     │ Staphylococcus     │ 14    │ Active   │
│ GP-ENT │ Enterococcus               │ Enterococcus       │ 8     │ Active   │
│ STREP  │ Streptococcus              │ Streptococcus      │ 10    │ Active   │
│ PSEUDO │ Pseudomonas/Acinetobacter  │ Non-fermenter      │ 12    │ Active   │
└────────┴────────────────────────────┴────────────────────┴───────┴──────────┘
```

**Empty state.** "No AST panels yet. **+ Add New** to define which antibiotics test against which organism groups."

### 5.3 Data model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `panel_id` | UUID PK | — | — |
| `name` | text | Yes | Unique, ≤ 100 chars |
| `code` | text | Yes | Unique, ≤ 20 chars, uppercase |
| `target_organism_group_id` | FK | No | If set, panel suggests for this group; if null, applies broadly |
| `target_specimen_type_id` | FK | No | If set, panel suggests for this specimen type (urine, blood, etc.) |
| `version` | int | Yes | Default 1; incremented on antibiotic-list changes |
| `active` | bool | Yes | Default true |
| `seeded` | bool | Yes | Default false |
| `notes` | text | No | — |
| audit columns | — | — | — |

### 5.4 Panel antibiotics junction

```
ast_panel_antibiotic
   ├── panel_id (FK)
   ├── antibiotic_id (FK)
   ├── tier (int: 1 = first-line, 2 = second-line, 3 = third-line)
   ├── report_default (enum: ALWAYS, CASCADE, SUPPRESS_UNLESS_R)
   └── (panel_id, antibiotic_id) unique
```

### 5.5 Add / Edit modal

`ComposedModal` size `lg`.

**Header section:**

- Code (TextInput, required)
- Name (TextInput, required)
- Target Organism Group (Dropdown, optional)
- Target Specimen Type (Dropdown, optional)
- Notes (TextArea)

**Antibiotics section (the heart of the panel):**

A `DataTable` of antibiotics in this panel, with columns: Antibiotic Name · WHONET Code · Tier · Report Default · Actions (remove). Below the table: an "Add Antibiotic" `ComboBox` that searches active antibiotics not already in the panel.

```
┌─ Antibiotics in this Panel ─────────────────────────────────  (ⓘ cascade tiers) ─┐
│ Antibiotic        │ WHONET │ Tier │ Report Default       │ Actions      │
├───────────────────┼────────┼──────┼──────────────────────┼──────────────┤
│ Ampicillin        │ AMP    │ 1    │ Always               │ ✕            │
│ TMP/SMX           │ SXT    │ 1    │ Always               │ ✕            │
│ Nitrofurantoin    │ NIT    │ 1    │ Always               │ ✕            │
│ Cefazolin         │ CFZ    │ 2    │ Cascade (if 1 all R) │ ✕            │
│ Ciprofloxacin     │ CIP    │ 2    │ Cascade              │ ✕            │
│ Ceftriaxone       │ CRO    │ 3    │ Cascade              │ ✕            │
│ Meropenem         │ MEM    │ 3    │ Suppress unless R    │ ✕            │
└───────────────────┴────────┴──────┴──────────────────────┴──────────────┘
[Add antibiotic: search...]                                          [Add]
```

Tier dropdown values: 1 / 2 / 3. Report Default values: ALWAYS / CASCADE / SUPPRESS_UNLESS_R. Tier and Report Default are inline-editable per row.

**Cascade-tier info (review edit H2).** An info icon (ⓘ) next to the antibiotics-section header opens a popover explaining what the tiers mean for cascade reporting:

- **Tier 1** — first-line / always reported.
- **Tier 2** — cascade: reported only if **all** Tier-1 agents in the relevant class are R.
- **Tier 3** — reserve: suppressed unless specifically warranted (typically `SUPPRESS_UNLESS_R`).

The same copy is available as inline helper text under the Tier column header.

**Version note + save toast (review edit H1).**

When the antibiotic list changes (add, remove, reorder, tier change), the panel `version` increments on save. On a version-incrementing save, the UI shows a **toast**: *"AST panel '{name}' saved as version {n}. In-flight and historical susceptibility attempts keep the published version used at setup."* Historical AST Runs against prior versions are unaffected — they snapshot the panel version at AST setup time (per crosswalk Q4 versioning rules and [V2 case](amr-micro-v2-amendments.md#fr-17.6) §AST Run model).

### 5.6 Acceptance criteria

- **AC-M01-P-01**: Panel code unique, ≤ 20 chars uppercase.
- **AC-M01-P-02**: Adding/removing antibiotics from a panel increments version and shows the version-saved toast (review edit H1).
- **AC-M01-P-03**: Tier 1/2/3 dropdown, Report Default dropdown work inline.
- **AC-M01-P-04**: Cannot add the same antibiotic twice to one panel.
- **AC-M01-P-05**: Target Organism Group + Target Specimen Type drive AST Setup default selection in [V2 case](amr-micro-v2-amendments.md#fr-17.6).
- **AC-M01-P-06**: Deactivating a panel removes it from AST Setup dropdown but preserves historical AST Runs; the confirmation states this downstream impact.
- **AC-M01-P-07**: A cascade-tier info popover (Tier 1 always / Tier 2 cascade-if-all-T1-R / Tier 3 reserve) is reachable from the panel editor (review edit H2).
- **AC-M01-P-08**: Empty state renders for the panels list.

---

## 6. Culture media defaults

Culture protocols and workflow-based setup administration are retired. Editable
media defaults live on the culture test’s Reagents and media links; see
[V2 media defaults](amr-micro-v2-amendments.md#fr-05.2a).

## 7. Coded vocabularies that extend existing OE

Per crosswalk Q7, three additional coded vocabularies need WHONET code fields added to existing OE entities. These are not their own admin pages in M-01 — they're augmentations of existing surfaces:

### 7.1 Specimen Type (extends existing Sample Type vocabulary)

Add `whonet_code` field to the existing sample type table. Admin page already exists (Sample Type Management — see `Sample-Type-Management-FRS.md` in /upload/). Add WHONET code column to its list view and edit form. Out of scope for M-01 to redesign that page; M-01 owns adding the column.

### 7.2 Patient Origin (new small vocabulary)

A coded vocabulary on Orders capturing whether the patient was Inpatient / Outpatient / ICU / Emergency / Long-term Care / Unknown. Each value carries a WHONET code (e.g., `INP`, `OUT`, `ICU`, `EME`, `LTC`, `UNK`).

Implementation: a small `patient_origin` reference table with seeded values; FK from Order. Admin CRUD lives under Admin → Microbiology Reference Data → Patient Origin (5th sidenav item under Reference Data).

Phase 1A scope: seeded with the six values above; admin page is read-only (just lists). Full CRUD in Phase 1B if a deployment needs to add values.

### 7.3 Department / Ward

Most OE deployments already have a department vocabulary (referenced from Order). Add `whonet_code` field to that vocabulary's records. Out of scope for M-01 to redesign — just the field addition.

---

## 8. Permissions

| Action | Permission required |
|--------|---------------------|
| View any master list | `micro.ref.view` |
| Add / edit / delete records | `micro.ref.manage` |
| Import / review catalog updates | `catalog.update.review` (Catalog Subscription) |

Per `feedback_openelis_admin_permissions`, the admin menu in OE is binary; access to `Admin → Microbiology Reference Data` is governed by the same top-level admin permission. The codes above gate specific actions within those pages.

---

## 9. i18n keys

Estimated 80-100 keys across the four masters. Naming pattern:

```
admin.micro.ref.organism.list.title           "Organism Master"
admin.micro.ref.organism.list.searchPlaceholder "Search organisms..."
admin.micro.ref.organism.list.column.scientificName "Scientific Name"
admin.micro.ref.organism.list.column.whonetCode    "WHONET Code"
admin.micro.ref.organism.list.column.group         "Group"
admin.micro.ref.organism.list.column.gramStain     "Gram"
admin.micro.ref.organism.list.column.defaultPanel  "Default panel"
admin.micro.ref.organism.list.column.status        "Status"
admin.micro.ref.organism.list.empty                "No organisms yet. Add New, or seed the standard list from WHONET."
admin.micro.ref.organism.modal.title.add           "Add Organism"
admin.micro.ref.organism.modal.title.edit          "Edit Organism"
admin.micro.ref.organism.field.scientificName.label "Scientific Name"
admin.micro.ref.organism.field.scientificName.helper "E.g., Escherichia coli"
admin.micro.ref.organism.field.whonetCode.helper   "3-5 lowercase characters"
admin.micro.ref.organism.field.group.helper        "Used for expert-rule application"
admin.micro.ref.organism.field.initialSignificance.label  "Initial significance"
admin.micro.ref.organism.field.initialSignificance.helper "Pre-fills the isolate's significance; the tech can override per case"
admin.micro.ref.organism.field.defaultPanel.helper "Pre-selected at AST set-up"
admin.micro.ref.organism.field.intrinsicResistances.helper "Auto-set R in AST regardless of MIC/zone"
admin.micro.ref.organism.error.whonetCode.duplicate "WHONET code already in use"
admin.micro.ref.organism.error.whonetCode.format   "WHONET code must be 3-5 lowercase alphanumeric characters"
admin.micro.ref.organism.action.deactivate         "Deactivate"
admin.micro.ref.organism.deactivate.impact         "This organism will no longer appear in Isolate-ID pickers or as an AST default. Historical cases keep it."
admin.micro.ref.panel.tier.info                     "Tier 1 = first-line/always; Tier 2 = cascade if all Tier-1 are R; Tier 3 = reserve"
admin.micro.ref.panel.version.saved.toast           "AST panel '{name}' saved as version {n}. In-flight and historical runs keep their version."
...
```

Similar key trees for antibiotic and panel. Full key table to be enumerated in the i18n catalog at code time.

---

## 10. Open verification items (carried from crosswalk)

- Existing OE Sample Type vocabulary location and schema (for §7.1 WHONET code addition).
- Existing OE Department vocabulary (for §7.3).
- Patient Origin: does any existing OE deployment already have this as a free-text or coded field? If so, migrate; if not, greenfield.

---

## 11. Acceptance Criteria summary

All AC-M01-* items above, totaling roughly 30 criteria across the four masters plus three vocabulary-extension items.

---

## 12. References

- [V2 baseline](amr-micro-v2-amendments.md) Microbiology functional baseline
- M-02 Breakpoint Catalog (depends on Organism Master + Antibiotic Master)
- [V2 susceptibility](amr-micro-v2-amendments.md#fr-07.2b) AST Entry & Interpretation (consumes AST Panels + Antibiotic Master)
- M-06 Expert Rules (matches on Organism Group; consumes cascade tiers)
- [V2 Worklist](amr-micro-v2-amendments.md#fr-12.1) Worklist (incubating-stage due times from individual culture rows)
- M-08 Macro Library (provides `organisms` category macros that reference Organism Master)
- M-09 WHONET Export (reads WHONET codes from Organism Master + Antibiotic Master)
- Catalog Subscription & Metadata Sync (provides reference-data update import; M-10 retired)
- Test Catalog v2.5 (`test-catalog-requirements-v2.5.md`)
- Sample Type Management FRS (`Sample-Type-Management-FRS.md`)
- WHONET design review (`whonet-export-design-review-v1.md`)
