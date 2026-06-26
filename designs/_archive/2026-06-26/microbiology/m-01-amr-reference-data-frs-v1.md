# M-01 AMR Reference Data — Functional Requirements Specification

**Version:** 1.0
**Date:** 2026-05-15
**Module:** Admin → Microbiology Reference Data
**Phase:** 1A
**Owner:** Microbiology Module (M-00 parent)
**Status:** Draft

This spec covers the four reference-data masters that drive the Micro workflow: Organism Master, Antibiotic Master, AST Panels, and Culture Protocols. Each lives as its own admin page under `Admin → Microbiology Reference Data`, exposed via sidenav submenus (per `feedback_openelis_sidenav_submenus`).

This is the foundation that M-02 Breakpoint Catalog, M-04 Case Workbench, M-05 AST Entry, and M-09 WHONET Export all reference.

---

## 1. Overview

### 1.1 Purpose

Maintain the four reference-data vocabularies that power Micro:

- **Organism Master** — every organism the lab can identify, with WHONET codes for surveillance and groupings for rule application.
- **Antibiotic Master** — every antibiotic the lab can test, with WHONET codes and classification.
- **AST Panels** — which antibiotics get tested against which organism × specimen combinations, with tier ordering for cascade reporting.
- **Culture Protocols** — recipe per specimen type: which media to inoculate, incubation time, temperature, atmosphere.

These are admin-only surfaces. Day-to-day workflow consumes them but doesn't modify them.

### 1.2 Routes

| Surface | Route | Sidenav |
|---------|-------|---------|
| Organism Master list | `/admin/microbiology/organisms` | Admin → Microbiology Reference Data → Organisms |
| Antibiotic Master list | `/admin/microbiology/antibiotics` | Admin → Microbiology Reference Data → Antibiotics |
| AST Panels list | `/admin/microbiology/ast-panels` | Admin → Microbiology Reference Data → AST Panels |
| Culture Protocols list | `/admin/microbiology/culture-protocols` | Admin → Microbiology Reference Data → Culture Protocols |
| Add/Edit modals | (modal overlay on respective list views) | — |

### 1.3 Users

| Role | Actions |
|------|---------|
| Lab Manager | Full CRUD on all four masters |
| Microbiology Supervisor | View all; edit Notes fields only |
| Microbiology Technician | View all; no edit |
| System Administrator | All actions |

### 1.4 Integration

- **M-02 Breakpoint Catalog** consumes Organism Master and Antibiotic Master as FK targets.
- **M-04 Case Workbench** consumes Culture Protocols (default per Test Catalog test), Organism Master (Isolate ID), AST Panels (AST setup default).
- **M-05 AST Entry** consumes AST Panels + Antibiotic Master.
- **M-09 WHONET Export** reads WHONET codes from Organism Master, Antibiotic Master, and the Specimen Type and Origin coded vocabularies (latter two extend existing OE vocabularies — see Q7 in `amr-crosswalk-working.md`).
- **Test Catalog (existing OE)** carries a `default_culture_protocol_id` FK to Culture Protocols (per crosswalk Q8) and a `valid_organisms` multi-select reference to Organism Master (per crosswalk Q6).

---

## 2. Organism Master

### 2.1 Purpose

The single source of truth for organism identities. Carries WHONET surveillance codes, organism group memberships, intrinsic resistances, and the default AST Panel suggestion. Micro Tests in the Test Catalog reference this master to declare valid organism results (per crosswalk Q6: reuses the existing test → coded-result-vocabulary mechanism).

### 2.2 List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Microbiology Reference Data / Organisms                              │
│                                                                              │
│ Organism Master                                                  [+ Add New] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search organisms...]   Group: [All ▼]   Status: [Active ▼]                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Scientific Name           │ WHONET │ Group              │ Gram │ Status │ ⋮ │
├───────────────────────────┼────────┼────────────────────┼──────┼────────┼───┤
│ Escherichia coli          │ eco    │ Enterobacterales   │ Neg  │ Active │ ⋮ │
│ Klebsiella pneumoniae     │ kpn    │ Enterobacterales   │ Neg  │ Active │ ⋮ │
│ Staphylococcus aureus     │ sau    │ Staphylococcus     │ Pos  │ Active │ ⋮ │
│ Staphylococcus epidermidis│ sep    │ Staph (CoNS)       │ Pos  │ Active │ ⋮ │
│ Pseudomonas aeruginosa    │ pae    │ Non-fermenter      │ Neg  │ Active │ ⋮ │
│ Streptococcus pneumoniae  │ spn    │ Streptococcus      │ Pos  │ Active │ ⋮ │
│ Enterococcus faecalis     │ efa    │ Enterococcus       │ Pos  │ Active │ ⋮ │
│ Candida albicans          │ cal    │ Yeast              │ —    │ Active │ ⋮ │
└───────────────────────────┴────────┴────────────────────┴──────┴────────┴───┘
  Showing 1-50 of 342   [< 1 2 3 ... 7 >]
```

**Carbon components:** `DataTable` with `TableToolbar` (search + filter), `Pagination`, `OverflowMenu` for row actions.

**Row actions (overflow menu):** Edit · Duplicate · Deactivate (or Activate if currently inactive) · Delete (only if not referenced anywhere).

**Filters:**
- Group dropdown (All, Enterobacterales, Staphylococcus, Staph CoNS, Streptococcus, Enterococcus, Non-fermenter, Anaerobe, Yeast, Mycobacterium, Other)
- Status dropdown (Active, Inactive, All)
- Search by scientific name, common name, or WHONET code (case-insensitive substring)

### 2.3 Data model

| Field | Type | Required | Validation | Notes |
|-------|------|----------|-----------|-------|
| `organism_id` | UUID PK | — | — | System-generated |
| `scientific_name` | text | Yes | Unique across active records, ≤ 200 chars | E.g., "Escherichia coli" |
| `common_name` | text | No | ≤ 200 chars | E.g., "E. coli" |
| `whonet_code` | text | Yes | Unique, 3-5 lowercase chars, alphanumeric | Per WHONET organism list |
| `organism_group_id` | FK | Yes | FK to `organism_group` | Drives expert rule application |
| `gram_stain` | enum | No | POSITIVE / NEGATIVE / VARIABLE / NA | |
| `morphology` | enum | No | COCCI / BACILLI / COCCOBACILLI / YEAST / OTHER | |
| `oxygen_requirement` | enum | No | AEROBIC / ANAEROBIC / FACULTATIVE / MICROAEROPHILIC | |
| `clinical_significance_default` | enum | Yes | ALWAYS / USUALLY / SOMETIMES / RARELY / CONTAMINANT | Default for the Isolate.significance field on first creation; tech can override per case |
| `default_ast_panel_id` | FK | No | FK to `ast_panel` | Suggested panel when this organism is the Isolate's organism |
| `intrinsic_resistances` | M:N to antibiotic_master | No | — | Junction table; antibiotics this organism is always resistant to regardless of AST results |
| `active` | bool | Yes | Default true | Soft delete |
| `seeded` | bool | Yes | Default false | True if seeded from Hub (M-10) |
| `notes` | text | No | ≤ 1000 chars | Clinical or procedural notes |
| `created_at`, `created_by`, `last_updated_at`, `last_updated_by` | audit | — | — | Standard audit columns |

### 2.4 Organism Groups

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
| Mycobacterium | M. tuberculosis, NTM | Phase 4+ (M-14) |
| HACEK | Haemophilus, Aggregatibacter, Cardiobacterium, Eikenella, Kingella | Slow growers |
| Other | — | Catch-all |

### 2.5 Add / Edit modal

`ComposedModal` size `lg`. Two-column layout for top half; full-width for notes and intrinsic resistances.

**Top section — identity:**

- Scientific Name (TextInput, required)
- Common Name (TextInput)
- WHONET Code (TextInput, required, helper text "3-5 lowercase chars")
- Organism Group (Dropdown, required)

**Middle section — characteristics:**

- Gram Stain (Dropdown)
- Morphology (Dropdown)
- Oxygen Requirement (Dropdown)
- Clinical Significance Default (Dropdown, required)

**Bottom section — workflow defaults:**

- Default AST Panel (ComboBox, searchable across active panels)
- Intrinsic Resistances (MultiSelect from active antibiotics; helper text "Antibiotics this organism is always resistant to regardless of AST results")

**Footer:**

- Notes (TextArea, ≤ 1000 chars)
- Status toggle: Active / Inactive
- Cancel · Save (primary)

**Validation on save:**

- WHONET code unique among active records
- Scientific name unique among active records
- Required fields populated

### 2.6 Delete vs. Deactivate

- **Deactivate** is the default. Removes the organism from selection dropdowns in workflow surfaces but preserves all historical Isolate references. Deactivated records visible in admin list with `Status: Inactive` filter.
- **Delete** is only allowed if no Isolate, Breakpoint, or AST Panel references the record. Confirmation dialog warns the user. Deletion is hard; no undo.

### 2.7 Import from Hub

When M-10 Hub Subscription ships (Phase 1B), a "Import from Hub" action appears in the toolbar. It pulls the latest organism master list from the configured central repository and merges. Local additions are preserved; remote updates apply to records where `seeded = true` only.

In Phase 1A, the toolbar has a placeholder "Import from Hub" button that is disabled with tooltip "Available in Phase 1B."

### 2.8 Acceptance criteria

- **AC-M01-O-01**: List view renders all active organisms with pagination at 50 per page.
- **AC-M01-O-02**: Search filters by scientific name, common name, or WHONET code, case-insensitive substring.
- **AC-M01-O-03**: Group and Status filters reduce the list appropriately.
- **AC-M01-O-04**: Add modal validates WHONET code format (3-5 lowercase alphanumeric).
- **AC-M01-O-05**: Add modal rejects duplicate WHONET codes among active records.
- **AC-M01-O-06**: Edit modal pre-populates all fields from the selected record.
- **AC-M01-O-07**: Intrinsic Resistances MultiSelect references active antibiotics only.
- **AC-M01-O-08**: Deactivating an organism hides it from workflow dropdowns but keeps it visible in admin list.
- **AC-M01-O-09**: Delete attempt on a referenced organism is blocked with a clear error.
- **AC-M01-O-10**: All actions respect `micro.ref.view` / `micro.ref.manage` permissions.

---

## 3. Antibiotic Master

### 3.1 Purpose

The single source of truth for antibiotic identities. Carries WHONET surveillance codes and classification. Referenced by Breakpoint Catalog, AST Panels, and Expert Rules.

### 3.2 List view

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

### 3.3 Data model

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

### 3.4 Add / Edit modal

Smaller than Organism — single column.

- Name (TextInput, required)
- WHONET Code (TextInput, required, helper "3-4 uppercase chars")
- Antibiotic Class (Dropdown, required)
- Route (RadioButtonGroup: Oral / IV / Both / Topical)
- Active / Inactive toggle
- Notes (TextArea)

### 3.5 Acceptance criteria

- **AC-M01-A-01**: List, search, filter, pagination as for Organism Master.
- **AC-M01-A-02**: WHONET code uniqueness validated.
- **AC-M01-A-03**: Antibiotic Class dropdown limited to enumerated values.
- **AC-M01-A-04**: Deactivation removes antibiotic from AST Panels' antibiotic selection but preserves historical AST results.
- **AC-M01-A-05**: Delete blocked if referenced.

---

## 4. AST Panels

### 4.1 Purpose

Define which antibiotics get tested for which organism × specimen combinations. Drives the AST Setup defaults in M-04. Carries tier information for cascade reporting in M-06.

### 4.2 List view

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

### 4.3 Data model

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

### 4.4 Panel antibiotics junction

```
ast_panel_antibiotic
   ├── panel_id (FK)
   ├── antibiotic_id (FK)
   ├── tier (int: 1 = first-line, 2 = second-line, 3 = third-line)
   ├── report_default (enum: ALWAYS, CASCADE, SUPPRESS_UNLESS_R)
   └── (panel_id, antibiotic_id) unique
```

### 4.5 Add / Edit modal

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
┌─ Antibiotics in this Panel ─────────────────────────────────────────────┐
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

**Version note:**

When the antibiotic list changes (add, remove, reorder, tier change), the panel version increments on save. Historical AST Runs against prior versions are unaffected — they snapshot the panel version at AST setup time (per crosswalk Q4 versioning rules and M-04 §AST Run model).

### 4.6 Acceptance criteria

- **AC-M01-P-01**: Panel code unique, ≤ 20 chars uppercase.
- **AC-M01-P-02**: Adding/removing antibiotics from a panel increments version.
- **AC-M01-P-03**: Tier 1/2/3 dropdown, Report Default dropdown work inline.
- **AC-M01-P-04**: Cannot add the same antibiotic twice to one panel.
- **AC-M01-P-05**: Target Organism Group + Target Specimen Type drive AST Setup default selection in M-04.
- **AC-M01-P-06**: Deactivating a panel removes it from AST Setup dropdown but preserves historical AST Runs.

---

## 5. Culture Protocols

### 5.1 Purpose

Define the recipe per specimen type: media to inoculate, incubation duration, temperature, atmosphere. Referenced by Test Catalog (default protocol per micro Test) and used at Order Entry Step 1 + Inoculation modal in M-04.

### 5.2 List view

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin / Microbiology Reference Data / Culture Protocols                      │
│                                                                              │
│ Culture Protocols                                                [+ Add New] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search...]   Status: [Active ▼]                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Code         │ Name                  │ Media          │ Hours │ Status      │
├──────────────┼───────────────────────┼────────────────┼───────┼─────────────┤
│ BC-STD       │ Blood Culture Std     │ FA, FN         │ 120   │ Active      │
│ UR-RTN       │ Urine Routine         │ BAP, MAC       │ 24    │ Active      │
│ RESP-STD     │ Respiratory Standard  │ BAP, CHOC, MAC │ 48    │ Active      │
│ WOUND        │ Wound Culture         │ BAP, MAC, CNA, │ 48    │ Active      │
│              │                       │ THIO           │       │             │
│ CSF-URG      │ CSF Urgent            │ BAP, CHOC      │ 48    │ Active      │
│ STOOL-ENT    │ Stool Enteric         │ MAC, SS, XLD,  │ 48    │ Active      │
│              │                       │ CAMPY          │       │             │
└──────────────┴───────────────────────┴────────────────┴───────┴─────────────┘
  Showing 1-6 of 6                                                              
```

Typical small lab has 5-10 protocols total. Pagination rarely needed in practice but present for consistency.

### 5.3 Data model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `protocol_id` | UUID PK | — | — |
| `code` | text | Yes | Unique, ≤ 20 chars |
| `name` | text | Yes | Unique, ≤ 100 chars |
| `default_media_list` | JSON array of media codes | Yes | E.g., `["BAP", "MAC"]` |
| `default_incubation_hours` | int | Yes | Max read time |
| `max_incubation_days` | int | Yes | When to finalize as no growth |
| `default_temperature_c` | numeric | Yes | E.g., 35.0 |
| `default_atmosphere` | enum | Yes | AEROBIC, ANAEROBIC, CO2, MICROAEROPHILIC |
| `default_subculture_at_hours` | JSON array | No | E.g., `[24, 48]` for blood cultures that get subcultured at those points |
| `active` | bool | Yes | Default true |
| `seeded` | bool | Yes | Default false |
| `notes` | text | No | — |
| audit columns | — | — | — |

### 5.4 Media catalog (sub-table)

Stored in `media_type` table; seed data only in Phase 1A:

| Code | Name | Notes |
|------|------|-------|
| BAP | Blood Agar Plate | Sheep blood; non-selective |
| MAC | MacConkey | Gram-negative selective, lactose differential |
| CHOC | Chocolate Agar | Fastidious Gram-negatives |
| CNA | Colistin-Nalidixic Acid | Gram-positive selective |
| THIO | Thioglycollate Broth | Anaerobic enrichment |
| FA | Aerobic Blood Culture Bottle | BacT/Alert FA or equivalent |
| FN | Anaerobic Blood Culture Bottle | BacT/Alert FN or equivalent |
| SS | Salmonella-Shigella | Enteric selective |
| XLD | Xylose Lysine Deoxycholate | Enteric selective |
| CAMPY | Campylobacter Selective | Campylobacter (microaerophilic) |
| LJ | Löwenstein-Jensen | TB solid culture (M-14 Phase 4+) |
| SDA | Sabouraud Dextrose Agar | Fungal (Phase 1B/2) |

### 5.5 Add / Edit modal

`ComposedModal` size `md`.

- Code (TextInput, required, uppercase auto)
- Name (TextInput, required)
- Default Media (MultiSelect from `media_type` catalog, required)
- Max Incubation Days (NumberInput, 1-30)
- Default Read Hours (NumberInput, 1-720)
- Default Subculture At (TagInput accepting comma-separated hours; optional)
- Default Temperature (NumberInput, 25-45, step 0.5; default 35)
- Default Atmosphere (Dropdown, required)
- Active / Inactive toggle
- Notes (TextArea)

### 5.6 Test Catalog integration

The existing Test Catalog (v2.5) gains a `default_culture_protocol_id` FK on each micro Test. When the Test Catalog editor is opened for a micro Test, a `ComboBox` populated from active culture protocols appears. This is a small Test Catalog v2.5 amendment that's part of the M-01 work, not its own spec.

### 5.7 Acceptance criteria

- **AC-M01-C-01**: List, search, filter, pagination as for other masters.
- **AC-M01-C-02**: Default Media MultiSelect references active `media_type` records.
- **AC-M01-C-03**: Default Temperature accepts decimals; defaults to 35.
- **AC-M01-C-04**: Max Incubation Days drives Pending Cultures stage detail (e.g., "Day 2 of 5").
- **AC-M01-C-05**: Test Catalog editor shows Culture Protocol dropdown for micro Tests.
- **AC-M01-C-06**: Deactivating a Culture Protocol removes it from new selections but preserves historical Cases.

---

## 6. Coded vocabularies that extend existing OE

Per crosswalk Q7, three additional coded vocabularies need WHONET code fields added to existing OE entities. These are not their own admin pages in M-01 — they're augmentations of existing surfaces:

### 6.1 Specimen Type (extends existing Sample Type vocabulary)

Add `whonet_code` field to the existing sample type table. Admin page already exists (Sample Type Management — see `Sample-Type-Management-FRS.md` in /upload/). Add WHONET code column to its list view and edit form. Out of scope for M-01 to redesign that page; M-01 owns adding the column.

### 6.2 Patient Origin (new small vocabulary)

A coded vocabulary on Orders capturing whether the patient was Inpatient / Outpatient / ICU / Emergency / Long-term Care / Unknown. Each value carries a WHONET code (e.g., `INP`, `OUT`, `ICU`, `EME`, `LTC`, `UNK`).

Implementation: a small `patient_origin` reference table with seeded values; FK from Order. Admin CRUD lives under Admin → Microbiology Reference Data → Patient Origin (5th sidenav item under Reference Data).

Phase 1A scope: seeded with the six values above; admin page is read-only (just lists). Full CRUD in Phase 1B if a deployment needs to add values.

### 6.3 Department / Ward

Most OE deployments already have a department vocabulary (referenced from Order). Add `whonet_code` field to that vocabulary's records. Out of scope for M-01 to redesign — just the field addition.

---

## 7. Permissions

| Action | Permission required |
|--------|---------------------|
| View any master list | `micro.ref.view` |
| Add / edit / delete records | `micro.ref.manage` |
| Import from Hub (Phase 1B) | `micro.hub.manage` (per M-10) |

Per `feedback_openelis_admin_permissions`, the admin menu in OE is binary; access to `Admin → Microbiology Reference Data` is governed by the same top-level admin permission. The codes above gate specific actions within those pages.

---

## 8. i18n keys

Estimated 80-100 keys across the four masters. Naming pattern:

```
admin.micro.ref.organism.list.title           "Organism Master"
admin.micro.ref.organism.list.searchPlaceholder "Search organisms..."
admin.micro.ref.organism.list.column.scientificName "Scientific Name"
admin.micro.ref.organism.list.column.whonetCode    "WHONET Code"
admin.micro.ref.organism.list.column.group         "Group"
admin.micro.ref.organism.list.column.gramStain     "Gram"
admin.micro.ref.organism.list.column.status        "Status"
admin.micro.ref.organism.modal.title.add           "Add Organism"
admin.micro.ref.organism.modal.title.edit          "Edit Organism"
admin.micro.ref.organism.field.scientificName.label "Scientific Name"
admin.micro.ref.organism.field.scientificName.helper "E.g., Escherichia coli"
admin.micro.ref.organism.field.whonetCode.helper   "3-5 lowercase characters"
admin.micro.ref.organism.error.whonetCode.duplicate "WHONET code already in use"
admin.micro.ref.organism.error.whonetCode.format   "WHONET code must be 3-5 lowercase alphanumeric characters"
admin.micro.ref.organism.action.deactivate         "Deactivate"
admin.micro.ref.organism.action.activate           "Activate"
admin.micro.ref.organism.action.duplicate          "Duplicate"
admin.micro.ref.organism.action.delete             "Delete"
admin.micro.ref.organism.delete.confirm.title      "Delete organism?"
admin.micro.ref.organism.delete.confirm.message    "This action cannot be undone."
admin.micro.ref.organism.delete.blocked.title      "Cannot delete"
admin.micro.ref.organism.delete.blocked.message    "This organism is referenced by {{count}} Isolate(s) and cannot be deleted. Deactivate instead."
...
```

Similar key trees for antibiotic, panel, culture protocol. Full key table to be enumerated in the i18n catalog at code time.

---

## 9. Open verification items (carried from crosswalk)

- Existing OE Sample Type vocabulary location and schema (for §6.1 WHONET code addition).
- Existing OE Department vocabulary (for §6.3).
- Patient Origin: does any existing OE deployment already have this as a free-text or coded field? If so, migrate; if not, greenfield.

---

## 10. Acceptance Criteria summary

All AC-M01-* items above, totaling roughly 25-30 criteria across the four masters plus three vocabulary-extension items.

---

## 11. References

- M-00 Microbiology Module Parent Specification
- M-02 Breakpoint Catalog (depends on Organism Master + Antibiotic Master)
- M-04 Case Workbench Core (consumes Culture Protocols at Order Entry, Organism Master at Isolate ID, AST Panels at AST Setup)
- M-05 AST Entry & Interpretation (consumes AST Panels + Antibiotic Master)
- M-08 Macro Library (provides `organisms` category macros that reference Organism Master)
- M-09 WHONET Export (reads WHONET codes from Organism Master + Antibiotic Master)
- M-10 Hub Subscription (Phase 1B; provides Import from Hub action)
- Test Catalog v2.5 (`test-catalog-requirements-v2.5.md`)
- Sample Type Management FRS (`Sample-Type-Management-FRS.md`)
- WHONET design review (`whonet-export-design-review-v1.md`)
